// eslint-disable-next-line camelcase
import { subscribe, identity, toggle_class, query_selector_all } from 'svelte/internal'

import {
  findSchemaPathForElement,
  withPathOf,
  runAll,
  isString,
  asArray,
  isHTMLFormElement,
} from './utils'

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

/* eslint-disable max-params */
const updateToggle = <T extends Store>(
  node: Element,
  classes: ValidityCSSClasses,
  store: T,
  toggle: Toogle<T>,
  path?: string | undefined,
): Result<T> | undefined => withPathOf(node, (path) => toggle(node, classes, store, path), path)

const subscribeTo = <T extends Store>(
  path: string,
  node: Element,
  classes: ValidityCSSClasses,
  store: Readable<T>,
  toggle: Toogle<T>,
): Unsubscriber =>
  subscribe(store, (store: T) => updateToggle(node, classes, store, toggle, path)) as Unsubscriber

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

const isFormField = (node: Element): boolean =>
  isHTMLFormElement(node) || 'setCustomValidity' in node

const toogleClass = <T>(
  node: Element,
  classes: ValidityCSSClasses,
  state: T,
  key: 'dirty' | 'pristine' | 'error' | 'success' | 'validating' | 'submitting' | 'submitted',
): T => {
  const className = `${isFormField(node) ? 'is' : 'has'}-${key}` as keyof ValidityCSSClasses
  toggle_class(node, classes[className] || className, state)
  return state
}

const setCustomValidity = (node: Element, error: Error | undefined): Error | undefined => {
  ;(node as HTMLInputElement).setCustomValidity?.(error?.message || '')
  return error
}

const updateDirty = (
  node: Element,
  classes: ValidityCSSClasses,
  dirty: boolean | undefined,
): boolean | undefined => {
  toogleClass(node, classes, !dirty, 'pristine')
  return toogleClass(node, classes, dirty, 'dirty')
}

const updateSuccess = (
  node: Element,
  classes: ValidityCSSClasses,
  success: boolean | undefined,
): boolean | undefined => toogleClass(node, classes, success, 'success')

const updateError = <T extends undefined | (boolean | Error)>(
  node: Element,
  classes: ValidityCSSClasses,
  error: T,
): T => toogleClass(node, classes, error, 'error')

const updateValidating = (
  node: Element,
  classes: ValidityCSSClasses,
  validating: boolean | undefined,
): boolean | undefined => toogleClass(node, classes, validating, 'validating')

const updateValidity = (
  node: Element,
  classes: ValidityCSSClasses,
  error: Error | undefined,
): Error | undefined => updateError(node, classes, setCustomValidity(node, error))

const updateStoreDirty = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlySet<string>,
  path: string,
): boolean | undefined => updateDirty(node, classes, store.has(path))

const updateStoreValidity = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlyMap<string, Error>,
  path: string,
): Error | undefined => updateValidity(node, classes, store.get(path))

const updateStoreSuccess = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlySet<string>,
  path: string,
): boolean | undefined => updateSuccess(node, classes, store.has(path))

const updateStoreValidating = (
  node: Element,
  classes: ValidityCSSClasses,
  store: ReadonlySet<string>,
  path: string,
): boolean | undefined => updateValidating(node, classes, store.has(path))

const useFirstTo = <T>(
  update: (node: Element, classes: ValidityCSSClasses, state: T | undefined) => T | undefined,
) => (node: Element, classes: ValidityCSSClasses, results: (T | undefined)[]): T | undefined =>
  update(node, classes, results.find(identity)) // eslint-disable-line unicorn/no-fn-reference-in-iterator

const useEveryTo = <T>(
  update: (
    node: Element,
    classes: ValidityCSSClasses,
    state: boolean | undefined,
  ) => boolean | undefined,
) => (
  node: Element,
  classes: ValidityCSSClasses,
  results: (T | undefined)[],
): boolean | undefined => update(node, classes, results.every(identity)) // eslint-disable-line unicorn/no-fn-reference-in-iterator

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
      dispose = asArray(path).flatMap((path) => [
        subscribeTo(path, node, classes, context.dirty, updateStoreDirty),
        subscribeTo(path, node, classes, context.invalid, updateStoreValidity),
        subscribeTo(path, node, classes, context.valid, updateStoreSuccess),
        subscribeTo(path, node, classes, context.validating, updateStoreValidating),
      ])
    } else if (isHTMLFormElement(node)) {
      // Update classes on the form based on validity of the whole form
      dispose = [
        subscribe(context.isDirty, (dirty: boolean) => updateDirty(node, classes, dirty)),
        subscribe(context.isError, (error: boolean) => updateError(node, classes, error)),
        subscribe(context.isValidating, (validating: boolean) =>
          updateValidating(node, classes, validating),
        ),
        subscribe(context.isSubmitting, (submitting: boolean) =>
          toogleClass(node, classes, submitting, 'submitting'),
        ),
        subscribe(context.isSubmitted, (submitted: boolean) =>
          toogleClass(node, classes, submitted, 'submitted'),
        ),
      ]
    } else {
      // Update classes on this node based on the validity of its contained elements
      dispose = [
        subscribeToElements(
          node,
          classes,
          context.dirty,
          updateStoreDirty,
          useFirstTo(updateDirty),
        ),
        subscribeToElements(
          node,
          classes,
          context.invalid,
          updateStoreValidity,
          useFirstTo(updateValidity),
        ),
        subscribeToElements(
          node,
          classes,
          context.valid,
          updateStoreSuccess,
          useEveryTo(updateSuccess),
        ),
        subscribeToElements(
          node,
          classes,
          context.validating,
          updateStoreValidating,
          useFirstTo(updateValidating),
        ),
      ]
    }
  }

  update(options)

  return { update, destroy }
}
