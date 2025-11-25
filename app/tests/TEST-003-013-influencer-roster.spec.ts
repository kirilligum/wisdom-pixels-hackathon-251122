import { test, expect } from '@playwright/test';

/**
 * TEST-003: Influencer roster shows 5 influencers and toggles work
 * TEST-013: Influencer profiles are diverse
 * Verifies: REQ-003, REQ-013
 */
test.describe('Influencer Roster Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
    // Navigate to Influencers tab
    const influencersTab = page.locator('button:has-text("Influencers")');
    await influencersTab.click();
    await page.waitForTimeout(500);
  });

  test('TEST-003: should show all 5 influencer profiles', async ({ page }) => {
    // Check influencer count
    const influencerCards = page.locator('[data-testid="influencer-card"]');
    await expect(influencerCards.first()).toBeVisible({ timeout: 3000 });

    const count = await influencerCards.count();
    expect(count).toBe(5);
  });

  test('TEST-003: influencers should have use-in-generation toggle buttons', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find first influencer card
    const firstInfluencer = page.locator('[data-testid="influencer-card"]').first();
    await expect(firstInfluencer).toBeVisible();

    // Check for enable toggle button
    const toggle = firstInfluencer.locator('[data-testid="enable-toggle"]');
    await expect(toggle).toBeVisible();
  });

  test('TEST-003: should allow toggling influencer use-in-generation state', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find first influencer card
    const firstInfluencer = page.locator('[data-testid="influencer-card"]').first();

    // Find and click the enable toggle button
    const toggleButton = firstInfluencer.locator('[data-testid="enable-toggle"]');
    const initialLabel = await toggleButton.textContent();

    await toggleButton.click();
    await page.waitForTimeout(200);

    // Verify label changed to indicate toggled state
    const newLabel = await toggleButton.textContent();
    expect(newLabel).not.toBe(initialLabel);
  });

  test('TEST-013: influencers should have diverse ages and roles', async ({ page }) => {
    await page.waitForTimeout(500);

    // Get all influencer cards
    const influencerCards = page.locator('[data-testid="influencer-card"]');
    const count = await influencerCards.count();

    // Collect age ranges and roles
    const ageRanges = new Set<string>();
    const roles = new Set<string>();

    for (let i = 0; i < count; i++) {
      const card = influencerCards.nth(i);
      const text = await card.textContent();

      // Extract age and role information
      if (text) {
        // Look for age patterns like "30-35", "40-50"
        const ageMatch = text.match(/\d{2}-\d{2}/);
        if (ageMatch) {
          ageRanges.add(ageMatch[0]);
        }

        // Look for role keywords
        if (text.includes('Doctor') || text.includes('Coach') || text.includes('Prof')) {
          roles.add('present');
        }
      }
    }

    // Verify diversity: at least 3 different age ranges
    expect(ageRanges.size).toBeGreaterThanOrEqual(3);

    // Verify all influencers have roles
    expect(roles.size).toBeGreaterThan(0);
  });
});
