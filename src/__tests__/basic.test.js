import { render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'

import BasicForm from '../__fixtures__/basic-form'

test('should render', async () => {
  const { getByRole } = render(html`<${BasicForm} />`)

  const button = getByRole('button', { name: /submit/i })

  await fireEvent.click(button)

  expect(button).toBeInTheDocument()
})
