import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

import BasicForm from '../__fixtures__/basic-form.svelte'
import { findSchemaPathForElement } from '../internal/utils'

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

test('find path by id', () => {
  render(BasicForm)

  const titleLabel = screen.getByText('title')

  expect(findSchemaPathForElement(titleLabel)).toBe('title')
})

test('find path by dataset', () => {
  render(BasicForm)

  const nameLabel = screen.getByText('name')

  expect(findSchemaPathForElement(nameLabel)).toBe('name')
})

test('find path by name', () => {
  render(BasicForm)

  const emailLabel = screen.getByText('email')

  expect(findSchemaPathForElement(emailLabel)).toBe('email')
})
