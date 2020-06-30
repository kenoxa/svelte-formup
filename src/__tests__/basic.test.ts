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

  expect(email).toHaveClass('valid', 'pristine')
  expect(email).not.toHaveClass('invalid', 'dirty', 'validating')

  await userEvent.type(email, 'in@use.com')

  await waitFor(() => expect(email).toHaveClass('valid', 'dirty', 'validating'))

  await waitFor(() => expect(email).toHaveClass('invalid', 'dirty'))

  expect(email).not.toHaveClass('valid', 'pristine', 'validating')
})
