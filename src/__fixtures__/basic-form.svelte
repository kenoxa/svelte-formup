<script lang="typescript">
  import * as yup from 'yup'

  import { formup } from '../svelte-formup'

  import IfError from './if-error.svelte'

  export let delay = 0

  const { values, validate, validity } = formup({
    schema: yup.object().shape({
      title: yup.string().oneOf(['Mr.', 'Mrs.', 'Mx.']).notRequired(),
      name: yup.string().required(),
      email: yup
        .string()
        .email()
        .test({
          name: 'noDuplicateEmails',
          message: '${path} must be unique',
          test(value: string | undefined): Promise<boolean> {
            return new Promise((resolve) => {
              setTimeout(resolve, delay, value !== 'in@use.com')
            })
          },
        })
        .required(),
    }),
    onSubmit(data, context) {
      console.log('onSubmit', { data, context })
    },
  })
</script>

<form use:validate>
  <fieldset use:validity>
    <p use:validity>
      <label for="title">title</label>
      <select id="title" bind:value={$values.title}>
        <option>Mr.</option>
        <option>Mrs.</option>
        <option>Mx.</option>
      </select>
      <IfError at="title" />
    </p>

    <p use:validity>
      <label for="~name-id">name</label>
      <input id="~name-id" data-path-at="name" bind:value={$values.name} />
      <IfError at="name" />
    </p>
  </fieldset>

  <p use:validity>
    <label for="~special-email-id">email</label>
    <input
      id="~special-email-id"
      name="email"
      bind:value={$values.email}
      use:validate={{ on: 'input' }} />
    <IfError at="email" />
  </p>

  <p>
    <button type="submit">Submit</button>
    <button type="reset">Reset</button>
  </p>
</form>
