import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

test.setTimeout(45000);

test.beforeEach(async ({ context, page }) => {
  await context.clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
});

async function waitForAuthOrOnboarding(page) {
  // Wait for either /auth or /onboarding in the SAME tab
  await Promise.all([
    page.waitForURL(/\/(auth(\b|\/|\?)|onboarding(\/|$))/i, { timeout: 25000 }),
    page.waitForLoadState('domcontentloaded')
  ]);
  return /\/auth(\b|\/|\?)/i.test(page.url()) ? 'auth' : 'onboarding';
}

async function assertAuthUI(page) {
  // Top-level heading first
  const h1 = page.getByRole('heading', { name: /create your account|sign\s*up/i }).first();
  if (await h1.count()) { await expect(h1).toBeVisible(); return; }

  // If provider is inside an iframe, look there
  const frameH1 = page.frameLocator('iframe').getByRole('heading', { level: 1 }).first();
  if (await frameH1.count()) { await expect(frameH1).toBeVisible(); return; }

  // Fallback: typical auth button
  await expect(page.getByRole('button', { name: /create account|continue/i }).first()).toBeVisible();
}

async function assertOnboardingUI(page) {
  const marker = page.getByText(/onboarding|create your store|step[\s-]?1/i).first();
  await expect(marker).toBeVisible({ timeout: 10000 });
}

test.describe('Auth redirects (public landing)', () => {
  test('header CTA → signup or create', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    // Header CTA can be a button or a link
    let cta = page.getByRole('button', { name: /^create store$/i }).first();
    if (!(await cta.count())) cta = page.getByRole('link', { name: /^create store$/i }).first();
    await expect(cta).toBeVisible();

    await Promise.all([
      cta.click(),
      page.waitForURL(/\/(auth(\b|\/|\?)|onboarding(\/|$))/i, { timeout: 25000 })
    ]);
    const dest = await waitForAuthOrOnboarding(page);
    if (dest === 'auth') await assertAuthUI(page); else await assertOnboardingUI(page);
  });

  test('hero CTA → signup or create', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');

    const hero = page.getByRole('button', { name: /create your free store/i }).first();
    await expect(hero).toBeVisible();

    await Promise.all([
      hero.click(),
      page.waitForURL(/\/(auth(\b|\/|\?)|onboarding(\/|$))/i, { timeout: 25000 })
    ]);
    const dest = await waitForAuthOrOnboarding(page);
    if (dest === 'auth') await assertAuthUI(page); else await assertOnboardingUI(page);
  });
});
