// eslint-disable-next-line camelcase
import { run_all } from 'svelte/internal'

export const isString = (value: unknown): value is string => typeof value === 'string'

export const isHTMLFormElement = (node: Element | EventTarget): node is HTMLFormElement =>
  (node as HTMLElement).tagName === 'FORM'

export const runAll = (callbacks?: (undefined | null | false | (() => void))[]): void => {
  callbacks && run_all(callbacks.filter(Boolean))
}

export const asArray = <T>(value: T[] | T | undefined | false): T[] => {
  if (Array.isArray(value)) return value
  if (value) return [value]
  return []
}

const validatePath = (path?: unknown): false | string => isString(path) && path

export const findSchemaPathForElement = (
  node?: Element | EventTarget | null,
): undefined | null | false | string =>
  node &&
  !isHTMLFormElement(node) &&
  (validatePath((node as HTMLElement).dataset?.at) ||
    validatePath((node as HTMLInputElement).name) ||
    validatePath((node as HTMLLabelElement).htmlFor) ||
    validatePath((node as Element).id))

export const withPathOf = <T>(
  node: Element | EventTarget | null,
  callback: (path: string) => T,
): T | undefined => {
  const path = findSchemaPathForElement(node)

  if (path) return callback(path)
}
