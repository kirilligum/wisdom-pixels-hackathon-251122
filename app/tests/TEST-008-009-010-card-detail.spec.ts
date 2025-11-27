import { test, expect } from '@playwright/test';

/**
 * TEST-008: Card detail page loads with correct data
 * TEST-009: Card detail has unique URL
 * TEST-010: Card detail allows editing
 * Verifies: REQ-008, REQ-009, REQ-010
 */
test.describe('Card Detail Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
    // Navigate to Dataset tab
    const cardsTab = page.locator('button:has-text("Dataset")');
    await cardsTab.click();
    await page.waitForTimeout(500);
  });

  test('TEST-008: should load card detail page with correct data', async ({ page }) => {
    // Click on first card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Should navigate to card detail page
    await page.waitForURL(/\/cards\/card_\d+/, { timeout: 3000 });

    // Check that card detail page displays data
    await expect(page.locator('[data-testid="card-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-influencer-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-query-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-response-display"]')).toBeVisible();
  });

  test('TEST-009: card detail should have unique URL with card ID', async ({ page }) => {
    // Click on first card (card_001)
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Verify URL contains card ID
    await page.waitForURL(/\/cards\/card_001/, { timeout: 3000 });
    expect(page.url()).toContain('/cards/card_001');

    // Go back to gallery
    await page.goBack();
    await page.waitForURL(/\/brand\/flowform/, { timeout: 3000 });

    // Wait for Dataset tab to be active again
    const cardsTab = page.locator('button:has-text("Dataset")');
    await cardsTab.click();
    await page.waitForTimeout(500);

    // Click on second card (card_002)
    const secondCard = page.locator('[data-testid="card-item"]').nth(1);
    await secondCard.click();

    // Verify URL contains different card ID
    await page.waitForURL(/\/cards\/card_002/, { timeout: 3000 });
    expect(page.url()).toContain('/cards/card_002');
  });

  test('TEST-010: should allow editing card query', async ({ page }) => {
    // Click on first card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    await page.waitForURL(/\/cards\//, { timeout: 3000 });

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), button[data-testid="edit-button"]');
    await editButton.click();
    await page.waitForTimeout(300);

    // Should show editable fields
    const queryInput = page.locator('textarea[name="query"], input[name="query"]');
    await expect(queryInput).toBeVisible();

    // Edit query text
    await queryInput.clear();
    const newQuery = 'What is the best way to improve posture during yoga?';
    await queryInput.fill(newQuery);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[data-testid="save-button"]');
    await saveButton.click();
    await page.waitForTimeout(500);

    // Verify changes are displayed
    const queryDisplay = page.locator('[data-testid="card-query-display"]');
    await expect(queryDisplay).toContainText(newQuery);
  });

  test('TEST-010: should allow editing card response', async ({ page }) => {
    // Click on first card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    await page.waitForURL(/\/cards\//, { timeout: 3000 });

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), button[data-testid="edit-button"]');
    await editButton.click();
    await page.waitForTimeout(300);

    // Should show editable fields
    const responseInput = page.locator('textarea[name="response"]');
    await expect(responseInput).toBeVisible();

    // Edit response text
    await responseInput.clear();
    const newResponse = 'I recommend using the FlowForm Motion Suit for real-time feedback.';
    await responseInput.fill(newResponse);

    // Save changes
    const saveButton = page.locator('button:has-text("Save"), button[data-testid="save-button"]');
    await saveButton.click();
    await page.waitForTimeout(500);

    // Verify changes are displayed
    const responseDisplay = page.locator('[data-testid="card-response-display"]');
    await expect(responseDisplay).toContainText(newResponse);
  });

  test('TEST-009: should have back to gallery link', async ({ page }) => {
    // Click on first card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    await page.waitForURL(/\/cards\//, { timeout: 3000 });

    // Find back link
    const backLink = page.locator('a:has-text("Back"), a:has-text("Gallery"), a[href*="/brand/"]');
    await expect(backLink).toBeVisible();

    // Click back link
    await backLink.click();

    // Should return to gallery
    await page.waitForURL(/\/brand\/flowform/, { timeout: 3000 });
    expect(page.url()).toContain('/brand/flowform');
  });
});
