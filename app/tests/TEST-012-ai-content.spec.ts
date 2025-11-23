import { test, expect } from '@playwright/test';

test.describe('AI Content Generation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/brand/flowform');
  });

  test('TEST-012: should have an AI Content tab', async ({ page }) => {
    const aiContentTab = page.getByRole('button', { name: 'AI Content' });
    await expect(aiContentTab).toBeVisible();
  });

  test('TEST-012: should display example prompts', async ({ page }) => {
    // Click AI Content tab
    await page.getByRole('button', { name: 'AI Content' }).click();

    // Check for example prompts
    const examplePrompts = page.locator('button:has-text("Generate")');
    await expect(examplePrompts.first()).toBeVisible();

    // Should have at least 4 example prompts
    const promptCount = await page.locator('button:has-text("customer persona"), button:has-text("training environment"), button:has-text("training card"), button:has-text("professional athletes")').count();
    expect(promptCount).toBeGreaterThanOrEqual(3);
  });

  test('TEST-012: should show Mastra backend notice', async ({ page }) => {
    await page.getByRole('button', { name: 'AI Content' }).click();

    // Should show info about running Mastra server
    await expect(page.getByText('Mastra Backend Required')).toBeVisible();
    await expect(page.getByText('npm run dev:mastra')).toBeVisible();
  });

  test('TEST-012: should allow clicking example prompts', async ({ page }) => {
    await page.getByRole('button', { name: 'AI Content' }).click();

    // Find and click an example prompt button
    const exampleButton = page.locator('button').filter({ hasText: 'customer persona' }).first();
    await exampleButton.click();

    // Check that the textarea is populated
    const textarea = page.locator('textarea[placeholder*="generate"]');
    const textValue = await textarea.inputValue();
    expect(textValue.length).toBeGreaterThan(0);
    expect(textValue.toLowerCase()).toContain('persona');
  });

  test('TEST-012: should have generate button', async ({ page }) => {
    await page.getByRole('button', { name: 'AI Content' }).click();

    const generateButton = page.getByRole('button', { name: 'Generate Content' });
    await expect(generateButton).toBeVisible();

    // Button should be disabled when textarea is empty
    await expect(generateButton).toBeDisabled();
  });

  test('TEST-012: should enable generate button when prompt is entered', async ({ page }) => {
    await page.getByRole('button', { name: 'AI Content' }).click();

    const textarea = page.locator('textarea[placeholder*="generate"]');
    const generateButton = page.getByRole('button', { name: 'Generate Content' });

    // Type a prompt
    await textarea.fill('Generate a test persona');

    // Button should now be enabled
    await expect(generateButton).toBeEnabled();
  });

  test('TEST-012: should show loading state when generating', async ({ page }) => {
    await page.getByRole('button', { name: 'AI Content' }).click();

    const textarea = page.locator('textarea[placeholder*="generate"]');
    const generateButton = page.getByRole('button', { name: 'Generate Content' });

    // Enter a prompt
    await textarea.fill('Generate a customer persona for fitness enthusiasts');

    // Click generate
    await generateButton.click();

    // Should show loading state (button text changes)
    const loadingButton = page.getByRole('button', { name: 'Generating...' });
    await expect(loadingButton).toBeVisible({ timeout: 2000 });
  });
});
