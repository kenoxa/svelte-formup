// eslint-disable-next-line camelcase
import { listen, prevent_default } from 'svelte/internal'

import {
  asArray,
  findSchemaPathForElement,
  withPathOf,
  runAll,
  isString,
  isHTMLFormElement,
} from './utils'

import type {
  EventName,
  FormupContext,
  SvelteActionResult,
  ValidateActionOptions,
  Unsubscriber,
} from '../types'

const listenOn = (
  node: Element,
  events: EventName | readonly EventName[],
  listener: EventListener,
): Unsubscriber[] =>
  asArray(events as EventName | EventName[]).map((event) => listen(node, event, listener))

// For nested use:validate we want to handle events only once at the closest use:validate
const VALIDATE_EVENTS = new WeakSet<Event>()
const TOUCHED_EVENTS = new WeakSet<Event>()
const dedupeEvents = (events: WeakSet<Event>, listener: EventListener) => (event: Event) => {
  if (!events.has(event)) {
    events.add(event)
    listener(event)
  }
}

const listenWith = <T>(callback: (path: string) => T) => (event: Event): T | undefined =>
  withPathOf(event.target, callback)

export default function validate<Values, State>(
  context: FormupContext<Values, State>,
  node: Element,
  options?: string | ValidateActionOptions,
): SvelteActionResult<string | ValidateActionOptions> {
  let dispose: undefined | (Unsubscriber | undefined)[]

  const destroy = (): void => runAll(dispose)

  const update = (options: string | ValidateActionOptions = {}): void => {
    destroy()

    if (isString(options)) options = { at: options }

    const {
      at: path = findSchemaPathForElement(node),
      debounce = context.debounce,
      validateOn = options.on || context.validateOn,
      touchedOn = options.validateOn || context.touchedOn,
    } = options

    // Activate css classes; managed by validity action
    dispose = [context.validity(node, options).destroy]

    const validateAt = (path: string): void => context.validateAt(path, { debounce })
    const touchedAt = (path: string): void => context.setTouchedAt(path)

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
      if (isHTMLFormElement(node)) {
        // Setting the novalidate attribute on the form is what stops the form from showing its own error message bubbles,
        // and allows us to instead display the custom error messages in the DOM in some manner of our own choosing.
        node.noValidate = true

        // Ensure the aria role is set
        if (!node.role) node.role = 'form'

        dispose.push(
          listen(node, 'submit', prevent_default(context.submit)),
          listen(node, 'reset', prevent_default(context.reset)),
        )
      }

      dispose.push(
        ...listenOn(node, validateOn, dedupeEvents(VALIDATE_EVENTS, listenWith(validateAt))),
        ...listenOn(node, touchedOn, dedupeEvents(TOUCHED_EVENTS, listenWith(touchedAt))),
      )
    }
  }

  update(options)

  return { update, destroy }
}
