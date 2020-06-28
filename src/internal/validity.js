import { subscribe, identity } from 'svelte/internal'

import { findSchemaPathForElement, withPathOf, runAll, isString } from './utils'

const updateToggle = (node, store, toggle) => withPathOf(node, (path) => toggle(node, store, path))

const subscribeTo = (store, node, toggle) =>
  subscribe(store, (store) => updateToggle(node, store, toggle))

const subscribeToElements = (store, node, toggle, combine) =>
  subscribe(store, (map) => {
    const results = []

    // Not using form.elements:
    // - 'elements' may be a schema field;
    //    in which case form.elements point to that associated element and not the collections
    // - `[contenteditable]` fields are not included in fields
    node
      .querySelectorAll('input,select,textarea,[contenteditable],output,object,button')
      .forEach((element) => {
        results.push(updateToggle(element, map, toggle))
      })

    combine(node, results)
  })

const setStoreCustomValidity = (node, store, path) => setCustomValidity(node, store.get(path))

const setCustomValidity = (node, error) => {
  // eslint-disable-next-line no-unused-expressions
  node.setCustomValidity?.(error?.message || '')
  return error
}

const updateStoreValidity = (node, store, path) => updateValidity(node, store.get(path))

const updateValidity = (node, error) => {
  setCustomValidity(node, error)
  return toogleClasses(node, error, 'invalid', 'valid')
}

const updateStoreTouched = (node, store, path) => updateTouched(node, store.has(path))

const updateTouched = (node, touched) => toogleClasses(node, touched, 'touched', 'untouched')

const toogleClasses = ({ classList }, state, on, off) => {
  classList.remove(state ? off : on)
  classList.add(state ? on : off)
  return state
}

// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
const withFirstError = (node, results) => updateValidity(node, results.find(identity))

// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
const withSomeTouched = (node, results) => updateTouched(node, results.some(identity))

export default function validity(node, options) {
  let dispose

  const destroy = () => runAll(dispose)

  const update = (options = {}) => {
    destroy()

    if (isString(options)) options = { at: options }

    const { at: path = findSchemaPathForElement(node) } = options

    if (path) {
      // Update classes on this node based on this node validity
      dispose = [
        subscribeTo(this.errors, node, updateStoreValidity),
        subscribeTo(this.touched, node, updateStoreTouched),
      ]
    } else if (node.tagName === 'FORM') {
      // Update classes on the form based on validity of the whole form
      dispose = [
        subscribe(this.isValid, (valid) => updateValidity(node, !valid)),
        subscribe(this.isTouched, (touched) => updateTouched(node, touched)),

        // To update the custom validitiy we need to error message
        subscribeToElements(this.errors, node, setStoreCustomValidity, withFirstError),
      ]
    } else {
      // Update classes on this node based on the validity of its contained elements
      dispose = [
        subscribeToElements(this.errors, node, updateStoreValidity, withFirstError),
        subscribeToElements(this.touched, node, updateStoreTouched, withSomeTouched),
      ]
    }
  }

  update(options)

  return { update, destroy }
}
