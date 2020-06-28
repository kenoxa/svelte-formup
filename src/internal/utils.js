// eslint-disable-next-line camelcase
import { run_all } from 'svelte/internal'

export const asArray = (value) => {
  if (Array.isArray(value)) return value
  if (value) return [value]
  return []
}

export const withPathOf = (node, callback) => {
  const path = findSchemaPathForElement(node)

  if (path) return callback(path)
}

const validatePath = (path) => typeof path === 'string' && path

export const findSchemaPathForElement = (node) =>
  node &&
  node.tagName !== 'FORM' &&
  (validatePath(node.dataset.at) ||
    validatePath(node.name) ||
    validatePath(node.for) ||
    validatePath(node.id))

export const runAll = (callbacks) => callbacks && run_all(callbacks.filter(Boolean))

export const isString = (value) => typeof value === 'string'
