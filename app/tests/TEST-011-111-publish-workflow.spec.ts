import { test, expect } from '@playwright/test';

/**
 * TEST-011: Status transitions and published list behavior
 * TEST-111: Published cards view shows correct URLs
 * Verifies: REQ-011
 */
test.describe('Publish Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
    await page.waitForTimeout(500);
  });

  test('TEST-011: should have a publish tab', async ({ page }) => {
    // Look for Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await expect(publishTab).toBeVisible({ timeout: 3000 });
  });

  test('TEST-011: publish tab should show list of cards with checkboxes', async ({ page }) => {
    // Navigate to Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await publishTab.click();
    await page.waitForTimeout(500);

    // Check for cards list
    const cardItems = page.locator('[data-testid="publish-card-item"]');
    await expect(cardItems.first()).toBeVisible({ timeout: 3000 });

    // Check that cards have checkboxes
    const firstCard = cardItems.first();
    const checkbox = firstCard.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('TEST-011: should display card status (draft/ready/published)', async ({ page }) => {
    // Navigate to Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await publishTab.click();
    await page.waitForTimeout(500);

    // Check for status indicator
    const firstCard = page.locator('[data-testid="publish-card-item"]').first();
    const status = firstCard.locator('[data-testid="card-status"]');
    await expect(status).toBeVisible();

    // Verify status contains one of the valid states
    const statusText = await status.textContent();
    expect(statusText?.toLowerCase()).toMatch(/draft|ready|published/);
  });

  test('TEST-011: should allow selecting cards and publishing them', async ({ page }) => {
    // Navigate to Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await publishTab.click();
    await page.waitForTimeout(500);

    // Select first 3 cards
    const cardItems = page.locator('[data-testid="publish-card-item"]');
    for (let i = 0; i < 3; i++) {
      const checkbox = cardItems.nth(i).locator('input[type="checkbox"]');
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        await checkbox.check();
      }
    }

    // Click publish button
    const publishButton = page.locator('button:has-text("Publish Selected"), button[data-testid="publish-button"]');
    await publishButton.click();
    await page.waitForTimeout(500);

    // Verify status changed (at least one card should show "published")
    const publishedCard = page.locator('[data-testid="card-status"]:has-text("published")').first();
    await expect(publishedCard).toBeVisible({ timeout: 2000 });
  });

  test('TEST-111: published cards list should show card URLs', async ({ page }) => {
    // Navigate to Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await publishTab.click();
    await page.waitForTimeout(500);

    // Select and publish a card
    const firstCard = page.locator('[data-testid="publish-card-item"]').first();
    const checkbox = firstCard.locator('input[type="checkbox"]');
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await checkbox.check();
    }

    const publishButton = page.locator('button:has-text("Publish Selected"), button[data-testid="publish-button"]');
    await publishButton.click();
    await page.waitForTimeout(500);

    // Check if card URL is displayed
    const cardUrl = page.locator('[data-testid="card-url"]').first();
    await expect(cardUrl).toBeVisible({ timeout: 2000 });

    // Verify URL contains /cards/
    const urlText = await cardUrl.textContent();
    expect(urlText).toContain('/cards/');
  });

  test('TEST-111: should show count of published cards', async ({ page }) => {
    // Navigate to Publish tab
    const publishTab = page.locator('button:has-text("Publish"), button:has-text("Publishing")');
    await publishTab.click();
    await page.waitForTimeout(500);

    // Look for published count indicator
    const publishedCount = page.locator('text=/\\d+ published|Published: \\d+/i');
    await expect(publishedCount).toBeVisible({ timeout: 2000 });
  });
});
