import { test, expect } from '@playwright/test';

test('visitor can exit the demo workspace', async ({ page }) => {
  await page.goto('/#/');

  // Enter the demo workspace.
  await page
    .locator('.landing-hero')
    .getByRole('button', { name: /Explore the demo/ })
    .click();

  await expect(page).toHaveURL(/#\/app$/);
  await expect(page.locator('#demo-workspace-banner')).toBeVisible();

  // Verify the exit action returns the visitor to the landing page.
  await page
  .locator('#demo-workspace-banner')
  .getByRole('button', { name: 'Exit demo' })
  .click();

  await expect(page).toHaveURL(/#\/$/);

  // Verify the landing page is visible again.
  await expect(
    page.getByRole('button', { name: /Explore the demo/ }).first()
  ).toBeVisible();

  // Verify the demo banner is no longer present.
  await expect(page.locator('#demo-workspace-banner')).toHaveCount(0);
});
