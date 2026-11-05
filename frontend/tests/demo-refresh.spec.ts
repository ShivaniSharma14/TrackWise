import { test, expect } from '@playwright/test';

test('demo workspace survives a browser refresh', async ({ page }) => {
  page.on('pageerror', error =>
    console.log('PAGE ERROR:', error.message)
  );

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/accounts/demo/')) {
      console.log('DEMO API:', response.status());
    }
  });

  await page.goto('/#/');

  const demoResponse = page.waitForResponse(
    response =>
      response.url().includes('/api/accounts/demo/') &&
      response.request().method() === 'POST'
  );

  await page
    .locator('.landing-hero')
    .getByRole('button', { name: /Explore the demo/ })
    .click();

  const response = await demoResponse;
  console.log('DEMO LOGIN SUCCESS:', response.ok());

  await expect(page).toHaveURL(/#\/app$/);
  await expect(page.locator('#demo-workspace-banner')).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/#\/app$/);
  await expect(page.locator('#demo-workspace-banner')).toBeVisible();
});
