# svelte-formup

> form helpers for [svelte]

[![License](https://badgen.net/npm/license/svelte-formup)](https://github.com/kenoxa/svelte-formup/blob/main/LICENSE)
[![Latest Release](https://badgen.net/npm/v/svelte-formup)](https://www.npmjs.com/package/svelte-formup)
[![View changelog](https://badgen.net/badge/%E2%80%8B/Explore%20Changelog/green?icon=awesome)](https://changelogs.xyz/svelte-formup)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/svelte-formup)](https://bundlephobia.com/result?p=svelte-formup)

[![CI](https://github.com/kenoxa/svelte-formup/workflows/CI/badge.svg)](https://github.com/kenoxa/svelte-formup/actions?query=branch%3Amain+workflow%3ACI)
[![Coverage Status](https://badgen.net/coveralls/c/github/kenoxa/svelte-formup/main)](https://coveralls.io/github/kenoxa/svelte-formup?branch=main)
[![PRs Welcome](https://badgen.net/badge/PRs/welcome/purple)](http://makeapullrequest.com)
[![Conventional Commits](https://badgen.net/badge/Conventional%20Commits/1.0.0/cyan)](https://conventionalcommits.org)

## What?

> Not standing in the way and keeping everything smooth.

- Plug'n'Play. Input elements in, values out.
- Works just like a normal form. Except it does all the tedious work for you.
- Extendable. Work with native form elements and custom input components out of the box.
- Two-Way Binding. `svelte-formup` is two-way bound by default. Change a value in your object, and it changes in your inputs.
- Async Validation. Everything is validated asynchronously for uninterrupted user experience.

## Why?

[svelte]s [action feature](https://svelte.dev/docs#use_action) is a unique way to attach custom logic to DOM elements. Combined with its great way of [two-way binding](https://svelte.dev/docs#bind_element_property) and its [reactive stores](https://svelte.dev/docs#svelte_store) this allows to write very native looking forms with no boilerplate.

Adding [yup] allows to define a schema for value parsing and validation. Yup schema are extremely expressive and allow modeling complex, interdependent validations, or value transformations.

Styling forms in a consistent way has always been a problem. Everyone has her own opinion about it. `svelte-formup` allows flexibel error reporting supporting both [native](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation) and programmatic usage. Invalid form elements [a marked](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/setCustomValidity) supporting several form state specific css selectors like [:invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid). Additionally `svelte-formup` adds CSS classes (`invalid`, `valid`, `touched` and `untouched`) for further custom styling. This classes maybe added to surrounding fieldsets or form group element depending on the validity state of the contained form elements.

## Installation

```sh
npm install svelte-formup
```

And then import it:

```js
// using es modules
import { formup } from 'svelte-formup'

// common.js
const { formup } = require('svelte-formup')
```

Alternatively use [UNPKG](https://unpkg.com/svelte-formup/) or [jsDelivr](https://cdn.jsdelivr.net/npm/svelte-formup/) packages:

With script tags and globals:

```html
<!-- UNPKG -->
<script src="https://unpkg.com/svelte-formup"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/svelte-formup"></script>

<script>
  <!-- And then grab it off the global like so: -->
  const { formup } = svelteFormup
</script>
```

Hotlinking from unpkg: _(no build tool needed!)_

```js
import { formup } from 'https://unpkg.com/svelte-formup?module'
```

## Usage

Using built-in HTML form elements ([Open in REPL](https://svelte.dev/repl/7eeaaf18965a4ec7a84b62d3a3387587?version=3.23.2)):

```html
<script>
  import * as yup from 'yup'

  import { formup } from '../svelte-formup'

  const { values, errors, touched, validate, validity } = formup({
    schema: yup.object().shape({
      title: yup.string().oneOf(['Mr.', 'Mrs.', 'Mx.']).required(),
      name: yup.string().required(),
      email: yup.string().email().required(),
    }),
    onSubmit(data, context) {
      console.log('onSubmit', { data, context })
    },
  })
</script>

<form use:validate>
  <p use:validity>
    <label for="title">title</label>
    <select id="title" bind:value="{$values.title}">
      <option></option>
      <option>Mr.</option>
      <option>Mrs.</option>
      <option>Mx.</option>
    </select>
    {#if $touched.has('title') && $errors.has('title')}
    <span>{$errors.get'title').message}</span>
    {/if}
  </p>

  <p use:validity>
    <label for="name">name</label>
    <input id="name" bind:value="{$values.name}" />
    {#if $touched.has('name') && $errors.has('name')}
    <span>{$errors.get'name').message}</span>
    {/if}
  </p>

  <p use:validity>
    <label for="email">email</label>
    <input id="email" bind:value="{$values.email}" />
    {#if $touched.has('email') && $errors.has('email')}
    <span>{$errors.get'email').message}</span>
    {/if}
  </p>

  <p>
    <button type="submit">Submit</button>
    <button type="reset">reset</button>
  </p>
</form>
```

### Displaying Error Message

`svelte-formup` does not provide any svelte components. Most projects have their own way of reporting errors. Below is an example component to simplify error handling:

```html
<script>
  import { getFormupContext } from 'svelte-formup'

  export let at

  const { touched, errors } = getFormupContext()

  let error

  $: error = $errors.get(at)
</script>

{#if $touched.has(at) && error}
<span class="error" aria-live="polite">
  <slot {error}>{error.message}</slot>
</span>
{/if}
```

This could be used like (omitting identical code for brevity) ([Open in REPL](https://svelte.dev/repl/333dbbf625ba4694b1d07a1bfa7c0b21?version=3.23.2)):

```html
<script>
  import IfError from './if-error.svelte'
</script>

<form use:validate>
  <p use:validity>
    <label for="title">title</label>
    <select id="title" bind:value="{$values.title}">
      <option></option>
      <option>Mr.</option>
      <option>Mrs.</option>
      <option>Mx.</option>
    </select>
    <IfError at="title" />
  </p>

  <p use:validity>
    <label for="name">name</label>
    <input id="name" bind:value="{$values.name}" />
    <IfError at="name" />
  </p>

  <p use:validity>
    <label for="email">email</label>
    <input id="email" bind:value="{$values.email}" />
    <IfError at="email" />
  </p>

  <p>
    <button type="submit">Submit</button>
    <button type="reset">reset</button>
  </p>
</form>
```

## API

`svelte-formup` exports two functions:

- [formup(options)](#formupoptions) is the main entrypoint which creates the [form context](#form-context-object)
- [getFormupContext()](#getformcontext) allows to access the [form context](#form-context-object) through the [svelte context](https://svelte.dev/docs#getContext)

### formup(options)

Creates and registers a new [form context](#form-context-object) using [options](#options) and returns it.

```html
<script>
  import { formup } from 'svelte-formup'

  const context = formup(options)
</script>
```

#### Options

##### schema: a [yup] compatible validation schema

> The object does not have to be [yup] schema. `svelte-formup` uses only the following methods:
>
> - [validate(value: any, options?: object): Promise<any, ValidationError>](https://www.npmjs.com/package/yup#mixedvalidatevalue-any-options-object-promiseany-validationerror)
> - [validateAt(path: string, value: any, options?: object): Promise<any, ValidationError>](https://www.npmjs.com/package/yup#mixedvalidateatpath-string-value-any-options-object-promiseany-validationerror)
>
> This allows custom validation without using [yup]

##### onSubmit?(values: any, context: FormContext): void | Promise<void> = noop

The optional form submission handler. It is passed the validate values and the [form context](#form-context-object).

> This method should never throw!

##### onReset?(context: FormContext): void = noop

The optional form reset handler. It is passed the [form context](#form-context-object).

##### getInitialValues?(): any = Object

A function called to initialize the form values on creation and reset. The default returns an empty object.

##### validateInitialValues?: boolean = false

Use this option to run validations each time after `getInitialValues()` has been called.

##### validateOn?: string[] = ['change']

A list of DOM events which trigger a validation. Common events are:

- [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)
- [input](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)
- [focus](https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event)
- [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event)

##### validateOn?: string[] = validateOn

A list of DOM events which mark a field as touched. This defaults to the same value as `validateOn`.

##### debounce?: number = 100

Timeout in milliseconds between a validation event and the validation start.

#### Form Context Object

This object provides access to all form related state.

##### values: SvelteStore\<Object>

The form values as a svelte store.

```html
<input id="email" bind:value="{$values.email}" />
```

##### errors: SvelteStore\<Map\<string, ValidationError>>

The form errors keyed by field path as a svelte store.

```html
{#if $errors.has(email)} $errors.get(email).message {/if}
```

##### touched: SvelteStore\<Set\<string>>

The touched fields by path as a svelte store. This allows to show errors conditionally if the user has already visited that field.

```html
{#if $touched.has(email) && $errors.has(email)} $touched.get(email).message {/if}
```

##### validating: SvelteStore\<Set\<string>>

The currently validated fields by path as a svelte store. This allows to show a spinner if a field is validated.

```html
{#if $validating.has(email)}<Spinner />{/if}
```

##### isValidating: SvelteStore\<boolean>

Determines if the form is currently validated because of a submit event.

##### isSubmitting: SvelteStore\<boolean>

Determines if the form is currently being submitted.

##### submitCount: SvelteStore\<number>

The current try of submitting the form. This value is reseted to zero after a successful submit.

##### isValid: SvelteStore\<boolean>

Determines if the while form is valid.

##### isTouched: SvelteStore\<boolean>

Determines if any field in the form has been touched.

##### handleSubmit(): Promise\<any>

Submits the form programmatically. This will abort all active field validation, validate all fields and call `onSubmit`.

##### handleReset(): void

Resets the form programmatically. This will abort all active field validation, reset all stores and call `onReset`.

##### setErrorAt(path: string, error?: ValidationError | null): void

Updates the errors store programmatically by setting the error for path or (if error is falsey) deleting the path from the store.

##### setTouchedAt(path: string, isTouched: boolean = true): void

Updates the touched store programmatically by adding the path or (if isTouched is falsey) deleting the path from the store.

##### setValidatingAt(path: string, isValidating: boolean = true): void

Updates the validating store programmatically by adding the path or (if isValidating is falsey) deleting the path from the store.

##### validateAt(path: string, { debounce = context.debounce } = {}): void

Triggers the validation of path after the given timeout.

#### validate(node, options: string | { at?: string, validateOn?: string[], touchedOn?: string[], debounce: number } = {})

A [svelte action](https://svelte.dev/docs#use_action) to validate the element and all its form children it is applied to.

> The `validity` action is applied automatically on that node.

```html
<script>
  import { formup } from 'svelte-formup'

  const { validate } = formup(options)
</script>

<form use:validate>
  <!-- .... --->
</form>
```

The optional options allow to override some context properties for this validation:

- `validateOn`: defaults to form context validateOn

  ```html
  <input use:validate={{ validateOn: ['input', 'change'] }}>
  ```

- `touchedOn`: defaults to validateOn and then form context validateOn

  ```html
  <input use:validate={{ touchedOn: ['blur'] }}>
  ```

- `debounce`: defaults to form context debounce

  ```html
  <input use:validate={{ debounce: 200 }}>
  ```

- `at`: allows to define for which attribute the validation should be triggered.

  ```html
  <input use:validate={{ at: 'email' }}>
  ```

  If `at` is not provided and the element is not a form it defaults to:

  - use data attribute `at`
  - the `name` attribute
  - the `for` attribute
  - the `id` attribute

  If the only option is `path` it can be used direcly:

  ```html
  <input use:validate={'email'}>
  ```

If the element is a form it registers `submit` and `reset` listeners.

If no path has been found is listens for the `validateOn` and `touched` events for itself and all its children.

##### validity(node, options: string | { at?: string } = {})

A [svelte action](https://svelte.dev/docs#use_action) to update the validity state of the element and all its form children it is applied to.That means updating `setCustomValidity` and the css classes `valid`, `invalid`, `touched` and `untouched`.

```html
<script>
  import { formup } from 'svelte-formup'

  const { validity } = formup(options)
</script>

<form use:validity>
  <!-- .... --->
</form>
```

- `at`: allows to define for which attribute the validitiy should be tracked.

  ```html
  <input use:validate={{ at: 'email' }}>
  ```

  If `at` is not provided and the element is not a form it defaults to:

  - use data attribute `at`
  - the `name` attribute
  - the `for` attribute
  - the `id` attribute

  If the only option is `path` it can be used directly:

  ```html
  <input use:validate={'email'}>
  ```

If the element is a form it uses `isValid` and `isTouched` stores to determines the validity.

If no path has been found it updates the validity for itself and all its children.

##### schema: Schema

Passed through from the options.

##### validateOn: string[]

Passed through from the options.

##### touchedOn: string[]

Passed through from the options.

##### debounce: number

Passed through from the options.

### getFormupContext()

Returns the [form context](#form-context-object).

```html
<script>
  import { getFormupContext } from 'svelte-formup'

  const context = getFormupContext()
</script>
```

## Polyfills

- [NodeList#forEach()](https://caniuse.com/#feat=mdn-api_nodelist_foreach): Edge >= 16, Safari >=10
- [Object.assign()](https://caniuse.com/#feat=mdn-javascript_builtins_object_assign): Edge >= 12
- [AbortController](https://caniuse.com/#feat=abortcontroller): Edge >= 16
- [WeakSet](https://caniuse.com/#feat=mdn-javascript_builtins_weakset): Edge >= 12
- [Promise](https://caniuse.com/#feat=promises): Edge >= 12
- [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of): Edge >= 12
- [async-await](https://caniuse.com/#feat=async-functions): Edge >= 15
- [Destructuring assignment](https://caniuse.com/#feat=mdn-javascript_operators_destructuring): Edge >= 14

## TODO

- [ ] add css class for each test per node: `yup.string().email().required()` => `email required`
- [ ] what about invalid path (validate and validateAt)
- [ ] how to handle disabled fields, skip validation?
- [ ] a guide how to implement a custom component
- [ ] use eslint with xo config and patch
- [ ] focus first error field after submit with error
- [ ] on focus add css class: maybe a focused store?
- [ ] provides IfError, Input, Select, Choice components using yup schema values to reduce boilerplate via 'svelte-formup-components'
- [ ] configurable validity class names
- [ ] svelte-society/recipes-mvp recipy: https://github.com/svelte-society/recipes-mvp/pull/47/files

## Related Projects

- [svelte-jsx] - write svelte components using [jsx] to simplify testing
- [svelte-htm] - [**H**yperscript **T**agged **M**arkup](https://www.npmjs.com/package/htm) for svelte to simplify testing
- [@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro) - helps to test UI components in a user-centric way

## Support

This project is free and open-source, so if you think this project can help you or anyone else, you may [star it on GitHub](https://github.com/kenoxa/svelte-formup). Feel free to [open an issue](https://github.com/kenoxa/svelte-formup/issues) if you have any idea, question, or you've found a bug.

## Contribute

Thanks for being willing to contribute!

**Working on your first Pull Request?** You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

We are following the [Conventional Commits](https://www.conventionalcommits.org) convention.

### Develop

- `npm test`: Run test suite
- `npm run build`: Generate bundles
- `npm run lint`: Lints code

## NPM Statistics

[![NPM](https://nodei.co/npm/svelte-formup.png)](https://nodei.co/npm/svelte-formup/)

## License

`svelte-formup` is open source software [licensed as MIT](https://github.com/kenoxa/svelte-formup/blob/main/LICENSE).

[svelte-jsx]: https://www.npmjs.com/package/svelte-jsx
[svelte-htm]: https://www.npmjs.com/package/svelte-htm
[yup]: https://www.npmjs.com/package/yup
[svelte]: https://svelte.dev/
