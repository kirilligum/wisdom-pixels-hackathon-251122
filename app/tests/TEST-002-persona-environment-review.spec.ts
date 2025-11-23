import { test, expect } from '@playwright/test';

/**
 * TEST-002: Personas and environments render correctly
 * Verifies: REQ-002, REQ-101 (usability)
 */
test.describe('TEST-002: Persona & Environment review UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
  });

  test('should display tabbed interface for review', async ({ page }) => {
    // Check for tabs
    await expect(page.locator('button:has-text("Personas"), a:has-text("Personas")')).toBeVisible();
    await expect(page.locator('button:has-text("Environments"), a:has-text("Environments")')).toBeVisible();
  });

  test('should display all 4 FlowForm personas', async ({ page }) => {
    // Navigate to Personas tab if needed
    const personasTab = page.locator('button:has-text("Personas"), a:has-text("Personas")');
    await personasTab.click();

    // Wait for personas to load
    await page.waitForTimeout(500);

    // Check for all 4 personas
    await expect(page.locator('text=WFH Yoga Creative')).toBeVisible();
    await expect(page.locator('text=Mid-Career Knowledge Worker')).toBeVisible();
    await expect(page.locator('text=Beginner Runner')).toBeVisible();
    await expect(page.locator('text=Young Parent')).toBeVisible();
  });

  test('should display at least 3 FlowForm environments', async ({ page }) => {
    // Navigate to Environments tab
    const envsTab = page.locator('button:has-text("Environments"), a:has-text("Environments")');
    await envsTab.click();

    // Wait for environments to load
    await page.waitForTimeout(500);

    // Check for some environments
    const environmentCount = await page.locator('[data-testid="environment-card"]').count();
    expect(environmentCount).toBeGreaterThanOrEqual(3);
  });

  test('should show persona descriptions and tags', async ({ page }) => {
    const personasTab = page.locator('button:has-text("Personas"), a:has-text("Personas")');
    await personasTab.click();

    await page.waitForTimeout(500);

    // Check that personas have descriptions
    await expect(page.locator('text=Remote creative professional')).toBeVisible();
    await expect(page.locator('text=yoga').first()).toBeVisible();
  });

  test('should show environment descriptions', async ({ page }) => {
    const envsTab = page.locator('button:has-text("Environments"), a:has-text("Environments")');
    await envsTab.click();

    await page.waitForTimeout(500);

    // Check for environment details (apartment type should be visible)
    await expect(page.locator('text=apartment').first()).toBeVisible();
  });

  test('should be able to switch between tabs', async ({ page }) => {
    // Click Personas tab
    const personasTab = page.locator('button:has-text("Personas"), a:has-text("Personas")');
    await personasTab.click();
    await page.waitForTimeout(300);

    // Verify persona content is visible
    await expect(page.locator('text=WFH Yoga Creative')).toBeVisible();

    // Click Environments tab
    const envsTab = page.locator('button:has-text("Environments"), a:has-text("Environments")');
    await envsTab.click();
    await page.waitForTimeout(300);

    // Verify environment content is visible and persona might not be
    const envCard = page.locator('[data-testid="environment-card"]').first();
    await expect(envCard).toBeVisible();
  });

  test('tabs should be discoverable and easy to use (TEST-102 partial)', async ({ page }) => {
    // Tabs should be clearly visible
    const personasTab = page.locator('button:has-text("Personas"), a:has-text("Personas")');
    const envsTab = page.locator('button:has-text("Environments"), a:has-text("Environments")');

    await expect(personasTab).toBeVisible();
    await expect(envsTab).toBeVisible();

    // Should be able to click without delay
    await personasTab.click();
    await expect(page.locator('text=WFH Yoga Creative')).toBeVisible({ timeout: 1000 });

    await envsTab.click();
    await expect(page.locator('[data-testid="environment-card"]').first()).toBeVisible({ timeout: 1000 });
  });
});
