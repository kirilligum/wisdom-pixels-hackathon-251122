import { test, expect } from '@playwright/test';

/**
 * TEST-014: Generate dataset flow triggers API and returns cards
 * Verifies: REQ-105/edge card generation path
 */
test.describe('Dataset generation', () => {
  test('click generate dataset triggers cards generation', async ({ page }) => {
    await page.goto('/brand/flowform');

    // Ensure we are on Dataset tab
    const cardsTab = page.getByRole('button', { name: /dataset/i });
    await cardsTab.click();

    // Click Generate Dataset / similar CTA
    const generateBtn = page.getByRole('button', { name: /generate dataset/i }).first();

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/brands/') && r.url().includes('/cards/generate')),
      generateBtn.click(),
    ]);

    expect([200, 201]).toContain(resp.status());
    const body = await resp.json();
    expect(body).toHaveProperty('cardIds');
  });
});
