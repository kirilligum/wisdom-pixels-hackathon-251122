import { test, expect } from '@playwright/test';

/**
 * TEST-006: Gallery grid shows all cards and thumbnails
 * TEST-007: Gallery filters by influencer and persona
 * TEST-102: Gallery load time < 2s
 * Verifies: REQ-006, REQ-007, REQ-102, REQ-014
 */
test.describe('Card Gallery Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
    // Navigate to gallery/cards tab
    const cardsTab = page.locator('button:has-text("Dataset")');
    await cardsTab.click();
    await page.waitForTimeout(500);
  });

  test('TEST-006: should display all 20 cards with thumbnails', async ({ page }) => {
    // Check card count
    const cards = page.locator('[data-testid="card-item"]');
    await expect(cards.first()).toBeVisible({ timeout: 3000 });

    const cardCount = await cards.count();
    expect(cardCount).toBe(20);

    // Check that each card has required elements
    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="card-image"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="card-query"]')).toBeVisible();
  });

  test('TEST-007: should filter cards by influencer', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find and use influencer filter
    const filter = page.locator('select[name="influencerFilter"]');
    await filter.selectOption({ label: 'Dr. Mira Solis' });
    await page.waitForTimeout(300);

    // Verify filtered results
    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(20);
  });

  test('TEST-007: should filter cards by persona', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find and use persona filter
    const filter = page.locator('select[name="personaFilter"]');
    await filter.selectOption({ index: 1 }); // Select first non-"All" option
    await page.waitForTimeout(300);

    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(20);
  });

  test('TEST-102: gallery should load in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/brand/flowform');

    const cardsTab = page.locator('button:has-text("Dataset")');
    await cardsTab.click();

    // Wait for cards to be visible
    await page.locator('[data-testid="card-item"]').first().waitFor({ state: 'visible', timeout: 3000 });

    const endTime = Date.now();
    const loadTime = (endTime - startTime) / 1000;

    expect(loadTime).toBeLessThan(2);
  });

  test('TEST-006: cards should display influencer name and query snippet', async ({ page }) => {
    await page.waitForTimeout(500);

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await expect(firstCard).toBeVisible();

    // Check for influencer name
    await expect(firstCard.locator('[data-testid="card-influencer"]')).toBeVisible();

    // Check for query text
    await expect(firstCard.locator('[data-testid="card-query"]')).toBeVisible();
  });

  test('TEST-006: cards should be clickable and navigate to detail', async ({ page }) => {
    await page.waitForTimeout(500);

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Should navigate to card detail page
    await page.waitForURL(/\/cards\//, { timeout: 3000 });
    expect(page.url()).toContain('/cards/');
  });
});
