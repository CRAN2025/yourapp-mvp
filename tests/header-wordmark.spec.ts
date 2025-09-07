import { test, expect } from '@playwright/test';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
test.describe('Header responsive', () => {
  test('brand remains visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    const brand = page.getByRole('banner').getByRole('link', { name: /shoplynk/i });
    await expect(brand).toBeVisible();
  });
});
