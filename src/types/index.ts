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

export type SvelteAction<P> = (node: Element, parameters?: P) => SvelteActionResult<P>

export type EventName = keyof GlobalEventHandlersEventMap | string

export interface ValidateOptions<
  Values = Record<string, unknown>,
  State = Record<string, unknown>
> {
  /**
   * Only validate the input, and skip and coercion or transformation. Default - false
   */
  strict?: boolean

  /**
   * Return from validation methods on the first error rather than after all validations run. Default - true
   */
  abortEarly?: boolean

  /**
   * Remove unspecified keys from objects. Default - false
   */
  stripUnknown?: boolean

  /**
   * When false validations will not descend into nested schema (relevant for objects or arrays). Default - true
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
  formup: FormupContext<Values, State>
  signal: AbortSignal
}

export interface FormupSchema<Values = Record<string, unknown>, State = Record<string, unknown>> {
  validate(value: unknown, options?: ValidateOptions<Values, State>): Promise<Values>
  validateAt<T>(path: string, value: T, options?: ValidateOptions<Values, State>): Promise<T>
}

export interface ValidityCSSClasses {
  readonly valid?: string
  readonly invalid?: string
  readonly pristine?: string
  readonly dirty?: string
  readonly validating?: string
  readonly submitting?: string
  readonly submitted?: string
}

export interface FormupContext<Values = Record<string, unknown>, State = Record<string, unknown>> {
  /**
   * Used for validation.
   */
  readonly schema: FormupSchema<Values, State>

  /**
   * Key value pair where key is the form field and value is the value entered or selected.
   */
  readonly values: Writable<Values>

  /**
   * Custom form state.
   */
  readonly state: Writable<State>

  /**
   * Whole form error, not associated with any field
   */
  readonly error: Readable<ValidationError | undefined>

  /**
   * Key value pair where key is the form field and value is the error associated with that field.
   *
   * If a validate function is provided to an input, then when it is called this map will be modified.
   */
  readonly errors: Readable<ReadonlyMap<string, ValidationError>>

  /**
   * Set of touched fields.
   */
  readonly touched: Readable<ReadonlySet<string>>

  /**
   * Set of currently validating field.
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
   * 1. It will call all schema.validate.
   * 2. It will call onSubmit if the form is valid. This function can be called manually
   *    however it is also called if you have a `<button type='submit'>` within the `<form>`.
   *
   * Repeated invocation while there is an active submit have no effect (eg are ignored).
   */
  readonly submit: () => Promise<void>

  /**
   * Function that will reset the form to its initial state.
   *
   * This may have no effect (eg is ignored) if there is an active submit.
   */
  readonly reset: () => void

  /**
   * Function that will set the forms error manually.
   */
  readonly setError: (error?: ValidationError | undefined | null | false) => void

  /**
   * Function that takes two parameters, the first is the field name, and the second is the error you want to set it to.
   */
  readonly setErrorAt: (path: string, error?: ValidationError | undefined | null | false) => void

  /**
   * Function that takes two parameters, the first is the field name, and the second is true or false.
   */
  readonly setTouchedAt: (path: string, touched?: boolean) => void

  /**
   * Function that takes two parameters, the first is the field name, and the second is true or false.
   */
  readonly setValidatingAt: (path: string, validating?: boolean) => void

  /**
   * Schedule a validation for the given field.
   */
  readonly validateAt: (path: string, options?: ValidateAtOptions) => void

  // Actions
  readonly validate: SvelteAction<string | ValidateActionOptions>
  readonly validity: SvelteAction<string | ValiditiyActionOptions>

  // Passed in options
  readonly validateOn: readonly EventName[]
  readonly touchedOn: readonly EventName[]
  readonly debounce: number
  readonly classes: ValidityCSSClasses
}

export interface ValidateAtOptions {
  debounce?: number
}

export interface ValidateActionOptions {
  at?: string
  on?: EventName[]
  validateOn?: EventName[]
  touchedOn?: EventName[]
  debounce?: number
}

export interface ValiditiyActionOptions {
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
