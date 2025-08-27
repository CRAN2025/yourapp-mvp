import { test, expect } from '@playwright/test';

test('auth honors mode=signup', async ({ page }) => {
  await page.goto('/auth?mode=signup&redirect=%2Fonboarding%2Fstep-1');
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
});

test('auth defaults to signin without mode parameter', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
});

test('auth mode switching updates URL', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/auth\?mode=signup/);
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
});