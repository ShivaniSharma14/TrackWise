import { test, expect } from '@playwright/test';

test('visitor can enter the interactive demo workspace', async ({ page }) => {
  await page.goto('/#/');

  const demoButton = page
    .locator('.landing-hero')
    .getByRole('button', { name: /Explore the demo/ });

  await expect(demoButton).toBeVisible();
  await demoButton.click();

  await expect(page).toHaveURL(/#\/app$/, { timeout: 45000 });
  await expect(page.locator('#demo-workspace-banner')).toBeVisible();
});
