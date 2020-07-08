import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

import BasicForm from '../__fixtures__/basic-form.svelte'

test('render', () => {
  render(BasicForm)

  const button = screen.getByRole('button', { name: /submit/i })

  expect(button).toBeInTheDocument()
})

test('async validation', async () => {
  render(BasicForm)

  const email = screen.getByRole('textbox', { name: /email/i })

  expect(email).toHaveClass('is-pristine')
  expect(email).not.toHaveClass('is-dirty', 'is-error', 'is-validating')

  await userEvent.type(email, 'in@use.com')

  await waitFor(() => expect(email).toHaveClass('is-dirty', 'is-validating'))

  await waitFor(() => expect(email).toHaveClass('is-error', 'is-dirty'))

  expect(email).not.toHaveClass('is-success', 'is-pristine', 'is-validating')
})
