// eslint-disable-next-line camelcase
import { listen, prevent_default, run_all } from 'svelte/internal'

import { asArray, findSchemaPathForElement, withPathOf } from './utils'

import validityAction from './validity'

const listenOn = (node, events, listener) =>
  asArray(events).map((event) => listen(node, event, listener))

// For nested use:validate we want to handle events only once at the closest use:validate
const VALIDATE_EVENTS = new WeakSet()
const TOUCHED_EVENTS = new WeakSet()
const dedupeEvents = (events, listener) => (event) => {
  if (!events.has(event)) {
    events.add(event)
    listener(event)
  }
}

const listenWith = (callback) => (event) => withPathOf(event.target, callback)

export default function validate(node, options) {
  let dispose

  const update = (options = {}) => {
    if (typeof options === 'string') options = { at: options }

    const {
      at: path = findSchemaPathForElement(node),
      debounce = this.debounce,
      validateOn = this.validateOn,
      touchedOn = options.validateOn || this.touchedOn,
    } = options

    // Activate css classes; managed by validity action
    const trackValidity = validityAction.call(this, node, options)

    dispose = [() => trackValidity.destroy()]

    const validateAt = (path) => this.validateAt(path, { debounce })
    const touchedAt = (path) => this.setTouchedAt(path)

    if (path) {
      // Update classes on this node based on this node validity
      dispose.push(
        ...listenOn(
          node,
          validateOn,
          dedupeEvents(VALIDATE_EVENTS, () => validateAt(path)),
        ),
        ...listenOn(
          node,
          touchedOn,
          dedupeEvents(TOUCHED_EVENTS, () => touchedAt(path)),
        ),
      )
    } else {
      if (node.tagName === 'FORM') {
        // Setting the novalidate attribute on the form is what stops the form from showing its own error message bubbles,
        // and allows us to instead display the custom error messages in the DOM in some manner of our own choosing.
        node.noValidate = true

        dispose.push(
          listen(node, 'submit', prevent_default(this.handleSubmit)),
          listen(node, 'reset', prevent_default(this.handleReset)),
        )
      }

      dispose.push(
        ...listenOn(node, validateOn, dedupeEvents(VALIDATE_EVENTS, listenWith(validateAt))),
        ...listenOn(node, touchedOn, dedupeEvents(TOUCHED_EVENTS, listenWith(touchedAt))),
      )
    }
  }

  update(options)

  return {
    update,
    destroy() {
      run_all(dispose.filter(Boolean))
    },
  }
}
