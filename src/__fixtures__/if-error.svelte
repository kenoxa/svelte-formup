<script>
  import { getFormupContext } from '../svelte-formup'

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
