import { render, fireEvent, screen } from '@testing-library/svelte'
import html from 'svelte-htm'

import BasicForm from '../__fixtures__/basic-form.svelte'

test('should render', async () => {
  render(html`<${BasicForm} />`)

  const button = screen.getByRole('button', { name: /submit/i })

  await fireEvent.click(button)

  expect(button).toBeInTheDocument()
})
