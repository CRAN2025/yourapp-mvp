import { test, expect, Page } from '@playwright/test';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

async function goToFirstDemoStore(page: Page): Promise<Page> {
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');

  const demo = page.locator('section:has-text("Demo Stores"), [data-section="demo-stores"]');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toBeVisible();

  let explore = demo.getByRole('link', { name: /explore\s+store/i }).first();
  if (!(await explore.count())) explore = demo.locator('a:has-text("Explore Store")').first();
  if (!(await explore.count())) explore = page.getByRole('link', { name: /explore\s+store/i }).first();

  await explore.scrollIntoViewIfNeeded();
  await expect(explore).toBeVisible();

  const maybePopup = page.waitForEvent('popup').catch(() => null);
  await explore.click({ force: true });
  const pop = await maybePopup;
  const target = pop ?? page;

  await target.waitForLoadState('networkidle');
  return target;
}

test.describe('Storefront Public', () => {
  test('loads storefront with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

    const p = await goToFirstDemoStore(page);
    const wa = p.locator('a[href*="wa.me"], a[href*="web.whatsapp.com"]').first();
    await expect(wa).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('desktop WhatsApp click opens wa.me or web.whatsapp.com', async ({ page }) => {
    const p = await goToFirstDemoStore(page);
    const wa = p.locator('a[href*="web.whatsapp.com"], a[href*="wa.me"]').first();
    await expect(wa).toBeVisible();
    const maybePopup = p.waitForEvent('popup').catch(() => null);
    await wa.click({ force: true });
    const dest = (await maybePopup) ?? p;
    await expect(dest).toHaveURL(/(web\.whatsapp\.com|wa\.me)/);
  });

  test.describe('mobile', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    });

    test('mobile WhatsApp link uses wa.me or web.whatsapp.com', async ({ page }) => {
      const p = await goToFirstDemoStore(page);
      const wa = p.locator('a[href*="wa.me"], a[href*="web.whatsapp.com"]').first();
      await expect(wa).toBeVisible();
      const href = await wa.getAttribute('href');
      expect(href).toMatch(/(wa\.me|web\.whatsapp\.com)/);
    });
  });
});
