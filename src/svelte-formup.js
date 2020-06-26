import { getContext, setContext } from 'svelte'
import { writable, derived, get } from 'svelte/store'
import { noop, subscribe } from 'svelte/internal'

import { asArray } from './internal/utils'

import validateAction from './internal/validate'
import validityAction from './internal/validity'

const CONTEXT_KEY = 'svelte-formup'

const setAt = (store, path, value) =>
  store.update((set) => {
    set[value ? 'add' : 'delete'](path)
    return set
  })

export const getFormupContext = () => getContext(CONTEXT_KEY)

export const formup = ({
  schema,
  onSubmit = noop,
  onReset = noop,
  getInitialValues = Object,
  validateInitialValues = false,
  validateOn = 'change',
  touchedOn = validateOn,
  debounce = 100,
}) => {
  const values = writable(getInitialValues())
  // Map<string, ValidationError>
  const errors = writable(new Map())
  // Set<string>
  const touched = writable(new Set())
  // Set<string>
  const validating = writable(new Set())

  const isSubmitting = writable(false)
  const isValidating = writable(false)

  const submitCount = writable(0)

  const setErrorAt = (path, error) =>
    errors.update((errors) => {
      if (error) {
        errors.set(path, error)
      } else {
        errors.delete(path)
      }

      return errors
    })

  const setTouchedAt = (path, isTouched = true) => setAt(touched, path, isTouched)
  const setValidatingAt = (path, isValidating = true) => setAt(validating, path, isValidating)

  const context = {
    schema,

    // The data object
    values,

    // These are objects keyed by path
    errors,
    touched,
    validating,

    // These are whole form related stores

    // Determines if the whole form is validating (most likely because of a submit)
    // this does not reflect individual field validation triggered by validateAt
    isValidating,
    isSubmitting,

    // The current try of submitting the form
    // this value is reseted after a successful submit
    submitCount,

    // These are summaries over all fields
    isValid: derived(errors, (errors) => errors.size === 0),
    isTouched: derived(touched, (touched) => touched.size !== 0),

    // Form methods
    handleSubmit,
    handleReset,

    // Methods to update specific paths
    setErrorAt,
    setTouchedAt,
    setValidatingAt,

    validateAt,

    // Passed in options
    validateOn: asArray(validateOn),
    touchedOn: asArray(touchedOn),
    debounce,
  }

  Object.assign(context, {
    validate: validateAction.bind(context),
    validity: validityAction.bind(context),
  })

  setContext(CONTEXT_KEY, context)

  // The svelte/store get has to subscribe each time it is called
  // we therefore subscribing only once and caching it in a local variable
  let currentValues
  subscribe(values, (values) => {
    currentValues = values
  })

  // Used to throttle validation calls per field
  const validateAtStates = new Map()
  if (validateInitialValues) validate()

  return context

  async function handleSubmit() {
    if (get(isSubmitting)) return
    isSubmitting.set(true)
    submitCount.update((count) => count + 1)

    abortActiveValidateAt()

    try {
      const data = await validate()

      if (data) {
        const result = await onSubmit(data, context)

        // After successful submit reset the count
        submitCount.set(0)

        return result
      }
    } finally {
      isSubmitting.set(false)
    }
  }

  function handleReset() {
    if (get(isSubmitting)) return

    abortActiveValidateAt()

    touched.set(new Set())
    errors.set(new Map())
    validating.set(new Set())

    submitCount.set(0)

    values.set(getInitialValues())
    if (validateInitialValues) validate()

    return onReset(context)
  }

  function abortActiveValidateAt() {
    validateAtStates.forEach((state) => {
      clearTimeout(state.t)

      if (state.c) state.c.abort()

      state.l = 0
      state.c = null
      state.t = null
    })
  }

  function validateAt(path, { debounce = context.debounce } = {}) {
    if (get(isSubmitting)) return

    let state = validateAtStates.get(path)

    if (!state) {
      validateAtStates.set(
        path,
        (state = {
          l: 0, // => timestamp of last schema.validateAt call
          t: null, // => timeoutID of current debounce
          c: null, // => the active AbortController
        }),
      )
    }

    // Abort previous validation
    if (state.c) state.c.abort()

    clearTimeout(state.t)
    state.t = setTimeout(doValidateAt, debounce, path, state, debounce)
  }

  async function doValidateAt(path, state, debounce) {
    // Have at least debounce milliseconds passed between validation calls for this field
    if (Date.now() - state.l < debounce) {
      return validateAt(path, { debounce })
    }

    const current = new AbortController()
    state.c = current
    state.l = Date.now()
    setValidatingAt(path)

    let foundError
    try {
      await schema.validateAt(path, currentValues, {
        abortEarly: true,
        strict: true,
        context: {
          signal: current.signal,
        },
      })
    } catch (error) {
      foundError = error
    }

    // Ensure we are still the last validation on that path
    if (state.c === current) {
      state.c = null

      setValidatingAt(path, false)
      setErrorAt(path, foundError)
    }
  }

  async function validate() {
    isValidating.set(true)

    try {
      const data = await schema.validate(currentValues, { abortEarly: false })

      // Every field is valid, reset errors
      errors.set(new Map())

      return data
    } catch (error) {
      const newErrors = new Map()

      touched.update((touched) => {
        error.inner.forEach((error) => {
          newErrors.set(error.path, error)
          touched.add(error.path)
        })
        return touched
      })

      errors.set(newErrors)
      return null
    } finally {
      isValidating.set(false)
    }
  }
}
