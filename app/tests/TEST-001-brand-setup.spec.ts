import { test, expect } from '@playwright/test';

/**
 * TEST-001: Brand setup form and analyze trigger work
 * Verifies: REQ-001
 */
test.describe('TEST-001: Brand setup flow', () => {
  test('should display brand setup form with required fields', async ({ page }) => {
    await page.goto('/');

    // Click to add brand or go to brand setup
    const setupLink = page.locator('text=Add Brand').or(page.locator('text=Setup Brand'));

    // If there's a setup link, click it
    const count = await setupLink.count();
    if (count > 0) {
      await setupLink.first().click();
    }

    // Verify form fields exist
    await expect(page.locator('input[name="brandName"]')).toBeVisible();
    await expect(page.locator('input[name="domain"]')).toBeVisible();
    await expect(page.locator('textarea[name="urls"]')).toBeVisible();
    await expect(page.locator('button:has-text("Analyze Content")')).toBeVisible();
  });

  test('should accept brand name, domain, and URLs', async ({ page }) => {
    await page.goto('/');

    // Navigate to setup if needed
    const setupLink = page.locator('text=Add Brand').or(page.locator('text=Setup Brand'));
    const count = await setupLink.count();
    if (count > 0) {
      await setupLink.first().click();
    }

    // Fill in the form
    await page.fill('input[name="brandName"]', 'FlowForm Motion Suit');
    await page.fill('input[name="domain"]', 'flowform.io');
    await page.fill('textarea[name="urls"]', 'https://flowform.io/landing\nhttps://flowform.io/product');

    // Verify values are entered
    await expect(page.locator('input[name="brandName"]')).toHaveValue('FlowForm Motion Suit');
    await expect(page.locator('input[name="domain"]')).toHaveValue('flowform.io');
  });

  test('should show loading state when analyzing content', async ({ page }) => {
    await page.goto('/');

    const setupLink = page.locator('text=Add Brand').or(page.locator('text=Setup Brand'));
    const count = await setupLink.count();
    if (count > 0) {
      await setupLink.first().click();
    }

    // Fill form
    await page.fill('input[name="brandName"]', 'FlowForm Motion Suit');
    await page.fill('input[name="domain"]', 'flowform.io');
    await page.fill('textarea[name="urls"]', 'https://flowform.io/landing');

    // Click analyze button
    await page.click('button:has-text("Analyze Content")');

    // Should show loading state
    await expect(page.locator('text=Analyzing').or(page.locator('text=Loading'))).toBeVisible({ timeout: 1000 });
  });

  test('should navigate to review screen after analysis', async ({ page }) => {
    await page.goto('/');

    const setupLink = page.locator('text=Add Brand').or(page.locator('text=Setup Brand'));
    const count = await setupLink.count();
    if (count > 0) {
      await setupLink.first().click();
    }

    // Fill and submit form
    await page.fill('input[name="brandName"]', 'FlowForm Motion Suit');
    await page.fill('input[name="domain"]', 'flowform.io');
    await page.fill('textarea[name="urls"]', 'https://flowform.io/landing');
    await page.click('button:has-text("Analyze Content")');

    // Wait for navigation
    await page.waitForURL(/\/brand\//, { timeout: 5000 });

    // Should be on brand page
    expect(page.url()).toContain('/brand');
  });

  test('should complete setup flow in under 30 seconds (TEST-101 partial)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    const setupLink = page.locator('text=Add Brand').or(page.locator('text=Setup Brand'));
    const count = await setupLink.count();
    if (count > 0) {
      await setupLink.first().click();
    }

    await page.fill('input[name="brandName"]', 'FlowForm Motion Suit');
    await page.fill('input[name="domain"]', 'flowform.io');
    await page.fill('textarea[name="urls"]', 'https://flowform.io/landing');
    await page.click('button:has-text("Analyze Content")');

    await page.waitForURL(/\/brand\//, { timeout: 5000 });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    expect(duration).toBeLessThan(30);
  });
});
