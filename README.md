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

Styling forms in a consistent way has always been a problem. Everyone has her own opinion about it. `svelte-formup` allows flexibel error reporting supporting both [native](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation) and programmatic usage. Invalid form elements [are marked](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/setCustomValidity) supporting several validity state specific css selectors like [:invalid](https://developer.mozilla.org/en-US/docs/Web/CSS/:invalid). Additionally `svelte-formup` adds CSS classes (`invalid`, `valid`, `dirty`, `pristine`, `validating`, `submitting` and `submitted`) for further custom styling. These classes maybe added to surrounding fieldsets or form group element depending on the validity state of the contained form elements.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [svelte-formup](#svelte-formup)
  - [What?](#what)
  - [Why?](#why)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Displaying Error Message](#displaying-error-message)
  - [API](#api)
  - [Polyfills](#polyfills)
  - [TODO](#todo)
  - [Related Projects](#related-projects)
  - [Support](#support)
  - [Contribute](#contribute)
    - [Develop](#develop)
  - [NPM Statistics](#npm-statistics)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

Alternatively use [UNPKG](https://unpkg.com/svelte-formup/) or [jsDelivr](https://cdn.jsdelivr.net/npm/svelte-formup/) packages.

Hotlinking from unpkg: _(no build tool needed!)_

```js
import { formup } from 'https://unpkg.com/svelte-formup?module'
```

## Usage

Using built-in HTML form elements ([Open in REPL](https://svelte.dev/repl/7eeaaf18965a4ec7a84b62d3a3387587?version=3.23.2)):

```html
<script>
  import * as yup from 'yup'

  import { formup } from 'svelte-formup'

  const { values, errors, dirty, validate, validity } = formup({
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
    {#if $dirty.has('title') && $errors.has('title')}
    <span>{$errors.get('title').message}</span>
    {/if}
  </p>

  <p use:validity>
    <label for="name">name</label>
    <input id="name" bind:value="{$values.name}" />
    {#if $dirty.has('name') && $errors.has('name')}
    <span>{$errors.get('name').message}</span>
    {/if}
  </p>

  <p use:validity>
    <label for="email">email</label>
    <input id="email" bind:value="{$values.email}" />
    {#if $dirty.has('email') && $errors.has('email')}
    <span>{$errors.get('email').message}</span>
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

  const { dirty, errors } = getFormupContext()

  let error

  $: error = $errors.get(at)
</script>

{#if $dirty.has(at) && error}
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

## Polyfills

- [NodeList#forEach()](https://caniuse.com/#feat=mdn-api_nodelist_foreach): Edge >= 16, Safari >=10
- [Object.assign()](https://caniuse.com/#feat=mdn-javascript_builtins_object_assign): Edge >= 12
- [AbortController](https://caniuse.com/#feat=abortcontroller): Edge >= 16
- [WeakSet](https://caniuse.com/#feat=mdn-javascript_builtins_weakset): Edge >= 12
- [Promise](https://caniuse.com/#feat=promises): Edge >= 12
- [Symbol.for](https://caniuse.com/#search=Symbol.for): Edge >= 12
- [for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of): Edge >= 12
- [async-await](https://caniuse.com/#feat=async-functions): Edge >= 15
- [Destructuring assignment](https://caniuse.com/#feat=mdn-javascript_operators_destructuring): Edge >= 14

## TODO

- [ ] add css class for each test per node: `yup.string().email().required()` => `email required`
- [ ] what about invalid path (validate and validateAt)
- [ ] debounce during testing: [Timer Mocks](https://jestjs.io/docs/en/timer-mocks)
- [ ] add aria based on schema: [ARIA Forms](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/forms)
- [ ] how to handle disabled fields, skip validation?
- [ ] a guide how to implement a custom component
- [ ] focus first error field after submit with error
- [ ] on focus add css class: maybe a focused store?
- [ ] provides IfError, Input, Select, Choice components using yup schema values to reduce boilerplate via 'svelte-formup-components'
- [ ] svelte-society/recipes-mvp recipy: [form validation with yup](https://github.com/svelte-society/recipes-mvp/pull/47/files)
- [ ] examples like [informed](https://joepuzzo.github.io/informed)

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
