<script lang="typescript">
  import * as yup from 'yup'

  import { formup } from '../svelte-formup'

  import IfError from './if-error.svelte'

  export let debounce = 0

  const { values, validate, validity } = formup({
    schema: yup.object().shape({
      title: yup.string().oneOf(['Mr.', 'Mrs.', 'Mx.']).required(),
      name: yup.string().required(),
      email: yup
        .string()
        .email()
        .test({
          name: 'noDuplicateEmails',
          message: '${path} must be unique',
          test(value: string | undefined): Promise<boolean> {
            return new Promise((resolve) => {
              setTimeout(resolve, debounce, value !== 'in@use.com')
            })
          },
        })
        .required(),
    }),
    onSubmit(data, context) {
      console.log('onSubmit', { data, context })
    },
    debounce,
  })
</script>

<form use:validate>
  <p use:validity>
    <label for="title">title</label>
    <select id="title" bind:value={$values.title}>
      <option />
      <option>Mr.</option>
      <option>Mrs.</option>
      <option>Mx.</option>
    </select>
    <IfError at="title" />
  </p>

  <p use:validity>
    <label for="name">name</label>
    <input id="name" bind:value={$values.name} />
    <IfError at="name" />
  </p>

  <p use:validity>
    <label for="email">email</label>
    <input id="email" bind:value={$values.email} use:validate={{ on: 'input' }} />
    <IfError at="email" />
  </p>

  <p>
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </p>
</form>
