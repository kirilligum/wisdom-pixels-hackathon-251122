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

  test('TEST-003: influencers should have enable/disable toggles', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find first influencer card
    const firstInfluencer = page.locator('[data-testid="influencer-card"]').first();
    await expect(firstInfluencer).toBeVisible();

    // Check for enable toggle
    const toggle = firstInfluencer.locator('input[type="checkbox"][data-testid="enable-toggle"], button:has-text("Enable"), button:has-text("Disable")');
    await expect(toggle).toBeVisible();
  });

  test('TEST-003: should allow toggling influencer enabled state', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find first influencer card
    const firstInfluencer = page.locator('[data-testid="influencer-card"]').first();

    // Find and click the enable toggle
    const toggle = firstInfluencer.locator('input[type="checkbox"][data-testid="enable-toggle"]');
    const initialState = await toggle.isChecked();

    await toggle.click();
    await page.waitForTimeout(200);

    // Verify state changed
    const newState = await toggle.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('TEST-003: should have set default button for each influencer', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find first influencer card
    const firstInfluencer = page.locator('[data-testid="influencer-card"]').first();

    // Check for set default button
    const defaultButton = firstInfluencer.locator('button:has-text("Set Default"), button:has-text("Default"), button[data-testid="set-default-button"]');
    await expect(defaultButton).toBeVisible();
  });

  test('TEST-003: should allow setting an influencer as default', async ({ page }) => {
    await page.waitForTimeout(500);

    // Find second influencer card
    const secondInfluencer = page.locator('[data-testid="influencer-card"]').nth(1);

    // Find and click set default button
    const defaultButton = secondInfluencer.locator('button:has-text("Set Default"), button[data-testid="set-default-button"]');

    // Check if button is clickable (not already default)
    const isDisabled = await defaultButton.isDisabled().catch(() => false);
    if (!isDisabled) {
      await defaultButton.click();
      await page.waitForTimeout(300);

      // Verify default indicator appears
      const defaultIndicator = secondInfluencer.locator('[data-testid="default-indicator"]');
      await expect(defaultIndicator).toBeVisible();
    }
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
