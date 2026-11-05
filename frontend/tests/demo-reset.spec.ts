import { test, expect } from '@playwright/test';

test('visitor can reset the demo workspace', async ({ page }) => {
  await page.goto('/#/');

  const demoResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/accounts/demo/') &&
    response.request().method() === 'POST'
  );

  await page
    .locator('.landing-hero')
    .getByRole('button', { name: /Explore the demo/ })
    .click();

  const demoResponse = await demoResponsePromise;
  expect(demoResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/#\/app$/);
  await expect(page.locator('#demo-workspace-banner')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());

  const resetResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/accounts/demo/reset/') &&
    response.request().method() === 'POST'
  );

  await page.getByRole('button', { name: 'Reset demo' }).click();

  const resetResponse = await resetResponsePromise;
  expect(resetResponse.ok()).toBeTruthy();

  await expect(
    page.getByText('Demo workspace restored to its original sample data.')
  ).toBeVisible();

  await expect(page.locator('#demo-workspace-banner')).toBeVisible();
});
