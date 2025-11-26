import { test, expect } from '@playwright/test';

test('login and logout flow with guest credentials', async ({ page }) => {
  // Ensure a clean state before app loads
  await page.addInitScript(() => {
    localStorage.removeItem('wp-simple-auth');
    sessionStorage.setItem('wp-skip-auto-login', '1');
  });
  await page.goto('/');

  // Login screen should be visible
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();

  // Login with guest / gguestt
  await page.fill('input[placeholder="Username"]', 'guest');
  await page.fill('input[placeholder="Password"]', 'gguestt');
  await page.getByRole('button', { name: 'Login' }).click();

  // Should land on home
  await expect(page.locator('h1')).toContainText('Wisdom Pixels');

  // Account menu should open and contain logout, then logout
  const account = page.locator('div[title="Account"]');
  await expect(account).toBeVisible();
  await account.click();
  const logout = page.locator('button:has-text("Log out")');
  await expect(logout).toBeVisible({ timeout: 3000 });
  await logout.click();

  // Login screen again
  await expect(page.getByPlaceholder('Username')).toBeVisible();
});
