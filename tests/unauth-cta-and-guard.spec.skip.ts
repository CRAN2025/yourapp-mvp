import { test, expect } from '@playwright/test';

test('unauth header CTA → signup with redirect', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /^create store$/i }).click();
  await expect(page).toHaveURL(/\/auth\?mode=signup&redirect=%2Fonboarding%2Fstep-1$/);
});

test('unauth hero CTA → signup with redirect', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /create your free store/i }).click();
  await expect(page).toHaveURL(/\/auth\?mode=signup&redirect=%2Fonboarding%2Fstep-1$/);
});

test('unauth direct nav to step-1 gets redirected to signup', async ({ page }) => {
  await page.goto('/onboarding/step-1');
  await expect(page).toHaveURL(/\/auth\?mode=signup&redirect=%2Fonboarding%2Fstep-1$/);
});

test('unauth direct nav to step-2 gets redirected to signup', async ({ page }) => {
  await page.goto('/onboarding/step-2');
  await expect(page).toHaveURL(/\/auth\?mode=signup&redirect=%2Fonboarding%2Fstep-2$/);
});

test('unauth direct nav to step-3 gets redirected to signup', async ({ page }) => {
  await page.goto('/onboarding/step-3');
  await expect(page).toHaveURL(/\/auth\?mode=signup&redirect=%2Fonboarding%2Fstep-3$/);
});