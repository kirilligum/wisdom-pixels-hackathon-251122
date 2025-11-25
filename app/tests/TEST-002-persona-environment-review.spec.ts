import { test, expect } from '@playwright/test';

/**
 * TEST-002: Personas and environments render correctly
 * Verifies: REQ-002, REQ-101 (usability)
 */
test.describe('TEST-002: Persona & Environment review UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
  });

  test('should display personas and environments sections together', async ({ page }) => {
    // Personas section heading
    await expect(page.locator('text=Personas').first()).toBeVisible();
    // Environments section heading
    await expect(page.locator('text=Environments').first()).toBeVisible();
  });

  test('should display all 4 FlowForm personas', async ({ page }) => {
    // Check for all 4 personas
    await expect(page.locator('text=WFH Yoga Creative')).toBeVisible();
    await expect(page.locator('text=Mid-Career Knowledge Worker')).toBeVisible();
    await expect(page.locator('text=Beginner Runner')).toBeVisible();
    await expect(page.locator('text=Young Parent')).toBeVisible();
  });

  test('should display at least 3 FlowForm environments', async ({ page }) => {
    // Check for some environments
    const environmentCount = await page.locator('[data-testid="environment-card"]').count();
    expect(environmentCount).toBeGreaterThanOrEqual(3);
  });

  test('should show persona descriptions and tags', async ({ page }) => {
    // Check that personas have descriptions
    await expect(page.locator('text=Remote creative professional')).toBeVisible();
    await expect(page.locator('text=yoga').first()).toBeVisible();
  });

  test('should show environment descriptions', async ({ page }) => {
    // Check for environment details (apartment type should be visible)
    await expect(page.locator('text=apartment').first()).toBeVisible();
  });

  // With the simplified product view, personas and environments are always visible
  // together, so there is no tab switching behavior to test anymore.
});
