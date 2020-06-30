// Declare common modules like importing assets
import '@carv/types'

/** Callback to inform of a value updates. */
export type Subscriber<T> = (value: T) => void

/** Unsubscribes from value updates. */
export type Unsubscriber = () => void

/** Callback to update a value. */
export type Updater<T> = (value: T) => T

/** Cleanup logic callback. */
export type Invalidator<T> = (value?: T) => void

export interface Readable<T> {
  /**
   * Subscribe on value changes.
   * @param run subscription callback
   * @param invalidate cleanup callback
   */
  subscribe(run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber
}

/** Writable interface for both updating and subscribing. */
export interface Writable<T> extends Readable<T> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(value: T): void

  /**
   * Update value using callback and inform subscribers.
   * @param updater callback
   */
  update(updater: Updater<T>): void
}

export interface SvelteActionResult<P> {
  update?: (parameters?: P) => void
  destroy?: () => void
}

/**
 * A [svelte action](https://svelte.dev/docs#use_action) to be applied on a element
 */
export type SvelteAction<P> = (node: Element, parameters?: P) => SvelteActionResult<P>

/**
 * A DOM event. Common events are:
 *
 * - [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)
 * - [input](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)
 * - [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event)
 * - [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event)
 */
export type EventName = keyof GlobalEventHandlersEventMap | string

export interface ValidateOptions<
  Values = Record<string, unknown>,
  State = Record<string, unknown>
> {
  /**
   * Only validate the input, and skip and coercion or transformation.
   *
   * @default true
   */
  strict?: boolean

  /**
   * Return from validation methods on the first error rather than after all validations run.
   *
   * @default true
   */
  abortEarly?: boolean

  /**
   * Remove unspecified keys from objects.
   *
   * @default true
   */
  stripUnknown?: boolean

  /**
   * When false validations will not descend into nested schema (relevant for objects or arrays).
   *
   * @default true
   */
  recursive?: boolean

  /**
   * Any context needed for validating schema conditions.
   */
  context: ValidateContext<Values, State>
}

export interface ValidateContext<
  Values = Record<string, unknown>,
  State = Record<string, unknown>
> {
  /**
   * The formup context.
   */
  formup: FormupContext<Values, State>

  /**
   * To be notified if the validation is longer needed.
   */
  signal: AbortSignal
}

/**
 * A [yup](https://www.npmjs.com/package/yup) like schema to perform validation.
 */
export interface FormupSchema<Values = Record<string, unknown>, State = Record<string, unknown>> {
  /**
   * Returns the value (a cast value if `options.strict` is false) if the value is valid,
   * and throws the errors otherwise.
   *
   * This method is asynchronous and returns a Promise object, that is fulfilled with the value, or rejected with a ValidationError.
   *
   * @param value the data to validate
   * @param options an object hash containing any schema options you may want to override (or specify for the first time).
   * @throws ValidationError
   */
  validate(value: unknown, options?: ValidateOptions<Values, State>): Promise<Values>

  /**
   * Validate a deeply nested path within the schema. Similar to how reach works, but uses the resulting schema as the subject for validation.
   *
   * @param path to validate
   * @param value the root value relative to the starting schema, not the value at the nested path.
   * @param options an object hash containing any schema options you may want to override (or specify for the first time).
   * @throws ValidationError
   */
  validateAt(path: string, value: Values, options?: ValidateOptions<Values, State>): Promise<Values>
}

export interface ValidityCSSClasses {
  /**
   * Set on the element if it or all its children is valid.
   * @default "valid"
   */
  readonly valid?: string

  /**
   * Set on the element if it or any of its children is invalid.
   * @default "invalid"
   */
  readonly invalid?: string

  /**
   * Set on the element if it or all its children is pristine.
   * @default "pristine"
   */
  readonly pristine?: string

  /**
   * Set on the element if it or any of its children is dirty.
   * @default "dirty"
   */
  readonly dirty?: string

  /**
   * Set on the element if it or any of its children is validating.
   * @default "validating"
   */
  readonly validating?: string

  /**
   * Set on the form if it is submitting.
   * @default "submitting"
   */
  readonly submitting?: string

  /**
   * Set on the form if it is has been submitted.
   * @default "submitted"
   */
  readonly submitted?: string
}

export interface FormupContext<Values = Record<string, unknown>, State = Record<string, unknown>> {
  /**
   * A [yup](https://www.npmjs.com/package/yup) like schema to perform validation.
   */
  readonly schema: FormupSchema<Values, State>

  /**
   * The form values as a svelte store.
   *
   * ```html
   * <input id="email" bind:value="{$values.email}" />
   * ```
   */
  readonly values: Writable<Partial<NonNullable<Values>>>

  /**
   * A top-level status object that you can use to represent form state that can't otherwise be expressed/stored with other methods.
   *
   * This is useful for capturing and passing through API responses to your inner component.
   */
  readonly state: Writable<State>

  /**
   * Whole form error, not associated with any field
   */
  readonly error: Readable<ValidationError | undefined>

  /**
   * The form errors keyed by field path as a svelte store.
   *
   * If a validate function is provided to a field, then when it is called this map will be modified.
   *
   * ```html
   * {#if $errors.has(email)} $errors.get(email).message {/if}
   * ```
   */
  readonly errors: Readable<ReadonlyMap<string, ValidationError>>

  /**
   * The dirty fields by path as a svelte store.
   *
   * This allows to show errors conditionally if the user has already visited that field.
   *
   * ```html
   * {#if $dirty.has(email) && $errors.has(email)} $dirty.get(email).message {/if}
   * ```
   */
  readonly dirty: Readable<ReadonlySet<string>>

  /**
   * The currently validating fields by path as a svelte store.
   *
   * This allows to show a spinner if a field is validated.
   *
   * ```html
   * {#if $validating.has(email)}<Spinner />{/if}
   * ```
   */
  readonly validating: Readable<ReadonlySet<string>>

  // These are whole form related stores

  /**
   * Determines if the whole form is validating (most likely because of a submit).
   *
   * This does not reflect individual field validation triggered by validateAt.
   *
   * When this becames `true` the `validating` CSS class is added to the form.
   */
  readonly isValidating: Readable<boolean>

  /**
   * Determines if the form is submitting (most likely because of a submit).
   *
   * When this becames `true` the `submitting` CSS class is added to the form.
   */
  readonly isSubmitting: Readable<boolean>

  /**
   * Determins if the form has been succesfully submitted.
   *
   * When this becames `true` the `submitted` CSS class is added to the form.
   */
  readonly isSubmitted: Readable<boolean>

  /**
   * Number of times the form was submitted.
   *
   * Reseted to zero after a succesful submit or a reset.
   */
  readonly submitCount: Readable<number>

  /**
   * Determines if the whole form is valid.
   *
   * When this becames `true` the `valid` CSS class is added to the form.
   */
  readonly isValid: Readable<boolean>

  /**
   * Boolean that is true when form is invalid.
   *
   * A form is invalid when any of its inputs fails its validation function ( if there are errors ).
   *
   * When this becames `true` the `invalid` CSS class is added to the form.
   */
  readonly isInvalid: Readable<boolean>

  /**
   * Boolean that is true when form is pristine.
   *
   * A form is pristine when it has not been touched && no values have been entered in any field.
   *
   * When this becames `true` the `pristine` CSS class is added to the form.
   */
  readonly isPristine: Readable<boolean>

  /**
   * Boolean that is true when pristine is false
   *
   * When this becames `true` the `dirty` CSS class is added to the form.
   */
  readonly isDirty: Readable<boolean>

  /**
   * This function will submit the form and trigger some lifecycle events.
   *
   * 1. abort all active field validation
   * 1. call all schema.validate.
   * 2. call onSubmit if the form is valid.
   *
   * This function can be called manually however it is also called if you
   * have a `<button type='submit'>` within the `<form>`.
   *
   * Repeated invocation while there is an active submit have no effect (eg are ignored).
   */
  readonly submit: () => Promise<void>

  /**
   * Function that will reset the form to its initial state.
   *
   * This will abort all active field validation, reset all stores and call `onReset`.
   *
   * This may have no effect (eg is ignored) if there is an active submit.
   */
  readonly reset: () => void

  /**
   * Set the form error manually.
   *
   * If `error` is falsey means deleting the path from the store.
   * @param error to set
   */
  readonly setError: (error?: ValidationError | undefined | null | false) => void

  /**
   * Set the error message of a field imperatively.
   *
   * @param path should match the key of errors you wish to update. Useful for creating custom input error handlers.
   * @param error to set; falsey means deleting the path from the store.
   */
  readonly setErrorAt: (path: string, error?: ValidationError | undefined | null | false) => void

  /**
   * Set the dirty state of a field imperatively.
   *
   * @param path should match the key of dirty you wish to update. Useful for creating custom input handlers.
   * @param dirty to set; falsey means deleting the path from the store.
   */
  readonly setDirtyAt: (path: string, dirty?: boolean) => void

  /**
   * Set the validating state of a field imperatively.
   *
   * @param path should match the key of validating you wish to update. Useful for creating custom input handlers.
   * @param validating to set; falsey means deleting the path from the store.
   */
  readonly setValidatingAt: (path: string, validating?: boolean) => void

  /**
   * Imperatively call field's validate function if specified for given field.
   */
  readonly validateAt: (path: string, options?: ValidateAtOptions) => void

  /**
   * A [svelte action](https://svelte.dev/docs#use_action) to validate the element and all its form children it is applied to.
   *
   * > The `validity` action is applied automatically on that node.
   *
   * ```html
   * <script>
   *   import { formup } from 'svelte-formup'
   *
   *   const { validate } = formup(options)
   * </script>
   *
   * <form use:validate>
   *   <!-- .... --->
   *
   *   <input use:validate={{ on: 'input' }}>
   *
   *   <!-- .... --->
   * </form>
   * ```
   */
  readonly validate: SvelteAction<string | ValidateActionOptions>

  /**
   * A [svelte action](https://svelte.dev/docs#use_action) to update the validity state of
   * the element and all its form children it is applied to.
   *
   * That means updating `setCustomValidity`, `aria-invalid` and the css classes `valid`,
   * `invalid`, `dirty`, `pristine`, `validating`, `submitting` and `submitted`.
   *
   * ```html
   * <script>
   *   import { formup } from 'svelte-formup'
   *
   *   const { validity } = formup(options)
   * </script>
   *
   * <form use:validity>
   *   <!-- .... --->
   * </form>
   * ```
   */
  readonly validity: SvelteAction<string | ValiditiyActionOptions>

  // Passed in options
  /**
   * Which events should trigger a validation.
   */
  readonly validateOn: readonly EventName[]

  /**
   * Which events should mark a field as dirty.
   */
  readonly dirtyOn: readonly EventName[]

  /**
   * Timeout in milliseconds after which a validation should start.
   */
  readonly debounce: number

  /**
   * Allow to override the used CSS classes.
   */
  readonly classes: ValidityCSSClasses
}

export interface ValidateAtOptions {
  /**
   * Timeout in milliseconds after which a validation should start.
   * @default context.debounce
   */
  debounce?: number
}

export interface ValidateActionOptions {
  /**
   * What field to validate.
   *
   * ```html
   * <input use:validate={{ at: 'email' }}>
   * ```
   *
   * If `at` is not provided and the element is not a form it defaults to:
   *
   * - the [data attribute](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) `at`
   * - the `name` attribute
   * - the `for` attribute
   * - the `id` attribute
   *
   * If the only option is `at` it can be used directly:
   *
   * ```html
   * <input use:validate={'email'}>
   * ```
   *
   * If no field has been found it validates itself and all its children.
   */
  at?: string

  /**
   * Override which events should trigger a validation and mark a field as dirty.
   */
  on?: EventName | EventName[]

  /**
   * Override which events should trigger a validation.
   *
   * ```html
   * <input use:validate={{ validateOn: ['input', 'change'] }}>
   *
   * <input use:validate={{ validateOn: 'blur' }}>
   * ```
   *
   * @default on || context.validateOn
   */
  validateOn?: EventName | EventName[]

  /**
   * Override which events should mark a field as dirty.
   * @default on || context.dirtyOn
   */
  dirtyOn?: EventName | EventName[]

  /**
   * Timeout in milliseconds after which a validation should start.
   * @default context.debounce
   */
  debounce?: number
}

export interface ValiditiyActionOptions {
  /**
   * For which field to track the validity status.
   *
   * If the element is a form it uses `isValid` and `isDirty` stores to determines the validity.
   *
   * ```html
   * <input use:validity={{ at: 'email' }}>
   * ```
   *
   * If `at` is not provided and the element is not a form it defaults to:
   *
   * - the [data attribute](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) `at`
   * - the `name` attribute
   * - the `for` attribute
   * - the `id` attribute
   *
   * If the only option is `at` it can be used directly:
   *
   * ```html
   * <input use:validity={'email'}>
   * ```
   *
   * If no field has been found it updates the validity for itself and all its children.
   */
  at?: string
}

export interface ValidationError extends Error {
  name: string
  message: string
  value?: unknown

  /**
   * A string, indicating where there error was thrown. path is empty at the root level.
   */
  path?: string
  type?: unknown

  /**
   * An array of error messages
   */
  errors?: string[]

  /**
   * In the case of aggregate errors, inner is an array of ValidationErrors throw earlier in the validation chain.
   */
  inner?: ValidationError[]
  params?: Record<string, unknown>
}
