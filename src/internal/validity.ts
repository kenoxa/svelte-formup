// eslint-disable-next-line camelcase
import { subscribe, identity, toggle_class, query_selector_all } from 'svelte/internal'

import { findSchemaPathForElement, withPathOf, runAll, isString, isHTMLFormElement } from './utils'

import type {
  FormupContext,
  SvelteActionResult,
  ValiditiyActionOptions,
  Readable,
  Unsubscriber,
  ValidityCSSClasses,
} from '../types'

type Store = ReadonlyMap<string, Error> | ReadonlySet<string>

type Result<T extends Store> = (T extends ReadonlyMap<string, Error> ? Error : boolean) | undefined

type Toogle<T extends Store> = (
  node: Element,
  classes: ValidityCSSClasses,
  store: T,
  path: string,
) => Result<T>

const updateToggle = <T extends Store>(
  node: Element,
  classes: ValidityCSSClasses,
  store: T,
  toggle: Toogle<T>,
): Result<T> => withPathOf(node, (path) => toggle(node, classes, store, path))

const subscribeTo = <T extends Store>(
  node: Element,
  classes: ValidityCSSClasses,
  store: Readable<T>,
  toggle: Toogle<T>,
): Unsubscriber =>
  subscribe(store, (store: T) => updateToggle(node, classes, store, toggle)) as Unsubscriber

/* eslint-disable max-params */
const subscribeToElements = <T extends Store>(
  node: Element,
  classes: ValidityCSSClasses,
  store: Readable<T>,
  toggle: Toogle<T>,
  combine: (node: Element, classes: ValidityCSSClasses, results: Result<T>[]) => void,
): Unsubscriber =>
  subscribe(store, (map: T) =>
    combine(
      node,
      classes,

      // Not using form.elements:
      // - 'elements' may be a schema field;
      //    in which case form.elements point to that associated element and not the collections
      // - `[contenteditable]` fields are not included in fields
      query_selector_all(
        'input,select,textarea,[contenteditable],output,object,button',
        node as HTMLElement,
      ).map((element) => updateToggle(element, classes, map, toggle)),
    ),
  ) as Unsubscriber
/* eslint-enable max-params */

const toogleClass = <T>(
  element: Element,
  classes: ValidityCSSClasses,
  state: T,
  key: keyof ValidityCSSClasses,
): T => {
  toggle_class(element, classes[key] || key, state)
  return state
}

/* eslint-disable max-params */
const toogleClasses = <T>(
  node: Element,
  classes: ValidityCSSClasses,
  state: T,
  on: keyof ValidityCSSClasses,
  off: keyof ValidityCSSClasses,
): T => {
  toogleClass(node, classes, !state, off)
  return toogleClass(node, classes, state, on)
}
/* eslint-enable max-params */

const updateDirty = (node: Element, classes: ValidityCSSClasses, dirty: boolean): boolean =>
  toogleClasses(node, classes, dirty, 'is-dirty', 'is-pristine')

const updateValidating = (
  node: Element,
  classes: ValidityCSSClasses,
  validating: boolean,
): boolean => toogleClass(node, classes, validating, 'is-validating')

const setCustomValidity = (node: Element, error: Error | undefined): Error | undefined => {
  node.setAttribute('aria-invalid', String(Boolean(error)))
  ;(node as HTMLInputElement).setCustomValidity?.(error?.message || '')
  return error
}

const updateStoreCustomValidity = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlyMap<string, Error>,
  path: string,
): Error | undefined => setCustomValidity(node, store.get(path))

const updateValidity = <T>(node: Element, classes: ValidityCSSClasses, state: T): T =>
  toogleClasses(node, classes, state, 'is-invalid', 'is-valid')

const updateCustomValidity = (
  node: Element,
  classes: ValidityCSSClasses,
  error: Error | undefined,
): Error | undefined => updateValidity(node, classes, setCustomValidity(node, error))

const updateStoreValidity = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlyMap<string, Error>,
  path: string,
): Error | undefined => updateCustomValidity(node, classes, store.get(path))

const updateStoreDirty = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlySet<string>,
  path: string,
): boolean => updateDirty(node, classes, store.has(path))

const updateStoreValidating = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlySet<string>,
  path: string,
): boolean => updateValidating(node, classes, store.has(path))

const withFirstError = (
  node: Element,
  classes: ValidityCSSClasses,
  results: (Error | undefined)[],
): Error | undefined => updateCustomValidity(node, classes, results.find(identity)) // eslint-disable-line unicorn/no-fn-reference-in-iterator

const withSome = (
  update: (node: Element, classes: ValidityCSSClasses, state: boolean) => boolean,
) => (node: Element, classes: ValidityCSSClasses, results: (boolean | undefined)[]): boolean =>
  update(node, classes, results.some(identity)) // eslint-disable-line unicorn/no-fn-reference-in-iterator

export default function validity<Values, State>(
  context: FormupContext<Values, State>,
  node: Element,
  options?: string | ValiditiyActionOptions,
): SvelteActionResult<string | ValiditiyActionOptions> {
  let dispose: undefined | Unsubscriber[]

  const destroy = (): void => runAll(dispose)

  const update = (options: string | ValiditiyActionOptions = {}): void => {
    destroy()

    if (isString(options)) options = { at: options }

    const { at: path = findSchemaPathForElement(node) } = options

    const classes = { ...context.classes, ...options.classes }

    if (path) {
      // Update classes on this node based on this node validity
      dispose = [
        subscribeTo(node, classes, context.errors, updateStoreValidity),
        subscribeTo(node, classes, context.dirty, updateStoreDirty),
        subscribeTo(node, classes, context.validating, updateStoreValidating),
      ]
    } else if (isHTMLFormElement(node)) {
      // Update classes on the form based on validity of the whole form
      dispose = [
        subscribe(context.isInvalid, (invalid: boolean) => updateValidity(node, classes, invalid)),
        subscribe(context.isDirty, (dirty: boolean) => updateDirty(node, classes, dirty)),
        subscribe(context.isValidating, (validating: boolean) =>
          updateValidating(node, classes, validating),
        ),
        subscribe(context.isSubmitting, (submitting: boolean) =>
          toogleClass(node, classes, submitting, 'is-submitting'),
        ),
        subscribe(context.isSubmitted, (submitted: boolean) =>
          toogleClass(node, classes, submitted, 'is-submitted'),
        ),

        // To update the custom validitiy we need the first error message
        subscribeToElements(
          node,
          classes,
          context.errors,
          updateStoreCustomValidity,
          withFirstError,
        ),
      ]
    } else {
      // Update classes on this node based on the validity of its contained elements
      dispose = [
        subscribeToElements(node, classes, context.errors, updateStoreValidity, withFirstError),
        subscribeToElements(node, classes, context.dirty, updateStoreDirty, withSome(updateDirty)),
        subscribeToElements(
          node,
          classes,
          context.validating,
          updateStoreValidating,
          withSome(updateValidating),
        ),
      ]
    }
  }

  update(options)

  return { update, destroy }
}
