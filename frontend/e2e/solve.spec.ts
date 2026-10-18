import { expect, test } from '@playwright/test'

// Runs against the built-in mock (VITE_USE_MOCK=true), so no backend is needed in CI.
// First mock problem: "12 children share 84 laddoos equally." Answer 7 (never sent to the client).

test('join -> solve one problem -> finish', async ({ page }) => {
  await page.goto('/')

  // Join
  await page.getByTestId('class-code').fill('CLASS5A')
  await page.getByTestId('join-button').click()
  await expect(page.getByTestId('student-code')).toHaveText(/^S-\d{4}$/)
  await page.getByTestId('start-button').click()

  // Step 1: facts
  await expect(page.getByTestId('step-facts')).toBeVisible()
  await page.getByTestId('mode-given').click()
  await page.getByTestId('token-s0').click() // 12
  await page.getByTestId('token-s3').click() // 84
  await page.getByTestId('mode-asked').click()
  await page.getByTestId('token-q1').click() // many
  await page.getByTestId('check-button').click()
  await expect(page.getByTestId('verdict-correct')).toBeVisible()

  // Step 2: model (tap a number, then tap its box)
  await expect(page.getByTestId('step-model')).toBeVisible()
  await page.getByTestId('model-groups_picture').click()
  await page.getByTestId('chip-total').click()
  await page.getByTestId('slot-total').click()
  await page.getByTestId('chip-groups').click()
  await page.getByTestId('slot-groups').click()
  await page.getByTestId('check-button').click()

  // Step 3: operation. A wrong choice shows a hint, then the student retries the same step.
  await expect(page.getByTestId('step-operation')).toBeVisible()
  await page.getByTestId('op-addition').click()
  await page.getByTestId('check-button').click()
  await expect(page.getByTestId('hint-text')).toBeVisible()
  await expect(page.getByTestId('step-operation')).toBeVisible()
  await page.getByTestId('op-division').click()
  await page.getByTestId('check-button').click()

  // Step 4: calculation
  await expect(page.getByTestId('step-calculation')).toBeVisible()
  await page.getByTestId('calc-input').fill('7')
  await page.getByTestId('check-button').click()

  // Step 5: sense check
  await expect(page.getByTestId('step-sense_check')).toBeVisible()
  await expect(page.getByTestId('sense-prompt')).toContainText('bigger or smaller than 84')
  await page.getByTestId('sense-smaller').click()

  // Transfer screen, then finish
  await expect(page.getByTestId('transfer-title')).toBeVisible()
  await expect(page.getByTestId('next-story-button')).toBeVisible()
  await page.getByTestId('done-button').click()
  await expect(page.getByTestId('finished-title')).toBeVisible()
})
