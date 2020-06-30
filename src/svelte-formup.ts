import { getContext, setContext } from 'svelte'
import { writable, derived, get } from 'svelte/store'
// eslint-disable-next-line camelcase
import { noop, subscribe, blank_object } from 'svelte/internal'

import { asArray } from './internal/utils'
import validateAction from './internal/validate'
import validityAction from './internal/validity'

import {
  EventName,
  FormupSchema,
  FormupContext,
  ValidateAtOptions,
  ValidationError,
  Writable,
  ValidateContext,
  ValidityCSSClasses,
} from './types'

const CONTEXT_KEY = Symbol.for('svelte-formup')

const setAt = (store: Writable<Set<string>>, path: string, value: boolean): void =>
  store.update((set) => {
    set[value ? 'add' : 'delete'](path)
    return set
  })

export * from './types'

export const getFormupContext = <
  Values = Record<string, unknown>,
  State = Record<string, unknown>
>(): FormupContext<Values, State> => getContext(CONTEXT_KEY) as FormupContext<Values, State>

interface ValidateState {
  /**
   * The timestamp of last schema.validateAt call
   */
  l: number

  /**
   * The timeoutID of current debounce
   */
  t?: number

  /**
   * The active AbortController
   */
  c?: AbortController
}

export interface FormupOptions<Values = Record<string, unknown>, State = Record<string, unknown>> {
  /**
   * A yup like schema to perform validation.
   */
  schema: FormupSchema<Values>

  /**
   * A function that gets called when form is submitted successfully. The function receives the values as a parameter.
   *
   * This function should never throw!
   */
  onSubmit?: (values: Values, context: FormupContext<Values, State>) => void | Promise<void>

  /**
   * A function that gets called when form is resetted.
   */
  onReset?: (context: FormupContext<Values, State>) => void

  /**
   * Use this if you want to populate the form with initial values.
   */
  getInitialValues?: () => Values

  /**
   * Should the initial values be validated.
   */
  validateInitialValues?: boolean

  state?: State
  validateOn?: EventName | EventName[]
  touchedOn?: EventName | EventName[]
  debounce?: number
  classes?: ValidityCSSClasses
}

const isEmpty = ({ size }: { size: number }): boolean => size === 0
const negate = (value: boolean): boolean => !value

export const formup = <Values = Record<string, unknown>, State = Record<string, unknown>>({
  schema,
  onSubmit = noop,
  onReset = noop,
  getInitialValues = blank_object,
  validateInitialValues = false,
  state = blank_object() as State,
  validateOn = 'change',
  touchedOn = validateOn,
  debounce = 100,
  classes = {},
}: FormupOptions<Values, State>): FormupContext<Values, State> => {
  const values = writable(getInitialValues())

  const errors = writable(new Map<string, Error>())
  const touched = writable(new Set<string>())
  const validating = writable(new Set<string>())

  const isSubmitting = writable(false)
  const isValidating = writable(false)
  const isSubmitted = writable(false)

  const isValid = derived(errors, isEmpty)
  const isPristine = derived(touched, isEmpty)

  const submitCount = writable(0)

  const setErrorAt: FormupContext['setErrorAt'] = (path, error) =>
    errors.update((errors) => {
      if (error) {
        errors.set(path, error)
      } else {
        errors.delete(path)
      }

      return errors
    })

  const setError: FormupContext['setError'] = (error) => setErrorAt('', error)

  const setTouchedAt: FormupContext['setTouchedAt'] = (path, isTouched = true) =>
    setAt(touched, path, isTouched)

  const setValidatingAt: FormupContext['setValidatingAt'] = (path, isValidating = true) =>
    setAt(validating, path, isValidating)

  const context: FormupContext<Values, State> = {
    schema,

    // The data object
    values,
    state: writable(state),

    error: derived(errors, (errors) => errors.get('')),

    // These are objects keyed by path
    errors,
    touched,
    validating,

    // These are whole form related stores

    // Determines if the whole form is validating (most likely because of a submit)
    // this does not reflect individual field validation triggered by validateAt
    isValidating,
    isSubmitting,
    isSubmitted,

    // The current try of submitting the form
    // this value is reseted after a successful submit
    submitCount,

    // These are summaries over all fields
    isValid,
    isInvalid: derived(isValid, negate),
    isPristine,
    isDirty: derived(isPristine, negate),

    // Form methods
    async submit(): Promise<void> {
      if (get(isSubmitting)) return

      isSubmitted.set(false)
      isSubmitting.set(true)
      submitCount.update((count) => count + 1)

      abortActiveValidateAt()

      try {
        const data = await validate()

        if (data) {
          const result = await onSubmit(data, context)

          // After successful submit reset the count
          submitCount.set(0)
          // ... and mark as submitted
          isSubmitted.set(true)

          return result
        }
      } catch (error) {
        setError(error)
      } finally {
        isSubmitting.set(false)
      }
    },

    reset(): void {
      if (get(isSubmitting)) return

      isSubmitted.set(false)

      abortActiveValidateAt()

      touched.set(new Set())
      errors.set(new Map())

      submitCount.set(0)

      values.set(getInitialValues())
      if (validateInitialValues) void validate()

      onReset(context)
    },

    setError,

    // Methods to update specific paths
    setErrorAt,
    setTouchedAt,
    setValidatingAt,

    validateAt,

    // Actions
    validate: (node, options) => validateAction(context, node, options),
    validity: (node, options) => validityAction(context, node, options),

    // Passed in options
    validateOn: asArray(validateOn),
    touchedOn: asArray(touchedOn),
    debounce,
    classes,
  }

  setContext(CONTEXT_KEY, context)

  // The svelte/store get has to subscribe each time it is called
  // we therefore subscribing only once and caching it in a local variable
  let currentValues: Values
  subscribe(values, (values: Values) => {
    currentValues = values
  })

  // Used to throttle validation calls per field
  const validateAtStates = new Map<string, ValidateState>()

  let validateAbortController: AbortController
  const createValidateContext = (controller: AbortController): ValidateContext<Values, State> => ({
    formup: context,
    signal: controller.signal,
  })

  // Start initial validation
  if (validateInitialValues) void validate()

  return context

  async function validate(): Promise<Values | void> {
    validateAbortController?.abort()
    validateAbortController = new AbortController()
    const currentController = validateAbortController

    isValidating.set(true)

    try {
      const data = await schema.validate(currentValues, {
        abortEarly: false,
        context: createValidateContext(validateAbortController),
      })

      // Ensure we are still the active validation
      if (currentController === validateAbortController) {
        // Every field is valid, reset errors
        errors.set(new Map())

        return data
      }
    } catch (error) {
      // Ensure we are still the active validation
      if (currentController === validateAbortController) {
        const newErrors = new Map<string, ValidationError>()

        touched.update((touched) => {
          ;[]
            .concat((error as ValidationError).inner || error)
            .forEach((error: ValidationError) => {
              if (error.path) {
                newErrors.set(error.path, error)
                touched.add(error.path)
              } else {
                setError(error)
              }
            })

          return touched
        })

        errors.set(newErrors)
      }
    } finally {
      if (currentController === validateAbortController) {
        isValidating.set(false)
      }
    }
  }

  function abortActiveValidateAt(): void {
    validateAtStates.forEach((state) => {
      clearTimeout(state.t)

      if (state.c) state.c.abort()

      state.l = 0
      state.c = undefined
      state.t = undefined
    })

    validating.set(new Set())
  }

  function validateAt(path: string, { debounce = context.debounce }: ValidateAtOptions = {}): void {
    if (get(isSubmitting)) return

    let state = validateAtStates.get(path)

    if (!state) {
      validateAtStates.set(path, (state = { l: 0 }))
    }

    // Abort previous validation
    state.c?.abort()

    clearTimeout(state.t)
    state.t = (setTimeout as Window['setTimeout'])(doValidateAt, debounce, path, state, debounce)
  }

  async function doValidateAt(path: string, state: ValidateState, debounce: number): Promise<void> {
    // Have at least debounce milliseconds passed between validation calls for this field
    if (Date.now() - state.l < debounce) {
      return validateAt(path, { debounce })
    }

    const current = new AbortController()
    state.c = current
    state.l = Date.now()
    setValidatingAt(path)

    let foundError: ValidationError | undefined
    try {
      await schema.validateAt(path, currentValues, {
        abortEarly: true,
        strict: true,
        context: createValidateContext(current),
      })
    } catch (error) {
      foundError = error as ValidationError
    }

    // Ensure we are still the last validation on that path
    if (state.c === current) {
      state.c = undefined

      setValidatingAt(path, false)
      setErrorAt(path, foundError)
    }
  }
}
