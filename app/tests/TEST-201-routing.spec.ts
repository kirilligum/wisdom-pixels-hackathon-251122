import { test, expect } from '@playwright/test';

/**
 * TEST-201: Contract test - Routes /, /brand/flowform, /cards/[id] exist
 * Verifies: REQ-201, REQ-202
 */
test.describe('TEST-201: Basic routing', () => {
  test('should load home page at /', async ({ page }) => {
    await page.goto('/');

    // Check for Wisdom Pixels title
    await expect(page.locator('h1')).toContainText('Wisdom Pixels');

    // Check for link to brand dashboard
    const brandLink = page.locator('a[href="/brand/flowform"]');
    await expect(brandLink).toBeVisible();
  });

  test('should load brand dashboard at /brand/flowform', async ({ page }) => {
    await page.goto('/brand/flowform');

    // Check for FlowForm brand heading
    await expect(page.locator('h1')).toContainText('FlowForm Brand Dashboard');

    // Check for back link
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });

  test('should load card detail at /cards/:id', async ({ page }) => {
    const testCardId = 'test-card-123';
    await page.goto(`/cards/${testCardId}`);

    // Check for Card Detail heading
    await expect(page.locator('h1')).toContainText('Card Detail');

    // Check that card ID is displayed
    await expect(page.getByText(`Card ID: ${testCardId}`)).toBeVisible();

    // Check for back link
    const backLink = page.locator('a[href="/brand/flowform"]');
    await expect(backLink).toBeVisible();
  });

  test('should navigate between routes', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Navigate to brand dashboard
    await page.click('a[href="/brand/flowform"]');
    await expect(page).toHaveURL('/brand/flowform');
    await expect(page.locator('h1')).toContainText('FlowForm Brand Dashboard');

    // Navigate back home
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Wisdom Pixels');
  });

  test('should have no console errors on any route', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Visit all routes
    await page.goto('/');
    await page.goto('/brand/flowform');
    await page.goto('/cards/test-123');

    // Verify no errors
    expect(consoleErrors).toEqual([]);
  });
});
