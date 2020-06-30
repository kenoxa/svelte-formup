<script lang="typescript">
  import { getFormupContext } from '../svelte-formup'
  import type { ValidationError } from '../svelte-formup'

  export let at: string

  const { dirty, errors } = getFormupContext()

  let error: ValidationError | undefined

  $: error = $errors.get(at)
</script>

{#if $dirty.has(at) && error}
  <span class="error" aria-live="polite">
    <slot {error}>{error.message}</slot>
  </span>
{/if}
