import { test, expect } from '@playwright/test';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

test.describe('Header brand', () => {
  test('basic alignment & a11y', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();

    const brand = page.getByRole('link', { name: /shoplynk/i }).first();
    let nav = page.getByRole('navigation');
    if (!(await nav.count())) nav = page.locator('nav');

    let cta = page.getByRole('button', { name: /(create\s+store|create\s+account|get\s+started)/i }).first();
    if (!(await cta.count())) cta = page.getByRole('link', { name: /(create\s+store|create\s+account|get\s+started)/i }).first();

    await brand.scrollIntoViewIfNeeded();
    await nav.scrollIntoViewIfNeeded();
    await cta.scrollIntoViewIfNeeded();

    await expect(brand).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(cta).toBeVisible();

    const [brandBox, navBox, ctaBox] = await Promise.all([
      brand.boundingBox(), nav.boundingBox(), cta.boundingBox()
    ]);
    if (!brandBox || !navBox || !ctaBox) throw new Error('missing header boxes');

    expect(brandBox.x).toBeLessThan(navBox.x);
    expect(navBox.x).toBeLessThan(ctaBox.x);
  });
});
