import { test, expect } from '@playwright/test';

test('header brand stays aligned & accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const headerInner = page.locator('header [class*="mx-auto"]');
  const heroInner = page.locator('section#signup .glass.heroGlass > .mx-auto');
  const brand = page.locator('header .brandText, header a[aria-label="ShopLynk home"]');
  const cta = page.locator('header button:has-text("Create Store")');

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100); // Allow layout to stabilize
    
    const h = await headerInner.boundingBox();
    const s = await heroInner.boundingBox();
    const b = await brand.boundingBox();
    const c = await cta.boundingBox();

    // Ensure elements exist
    expect(h).toBeTruthy();
    expect(s).toBeTruthy();
    expect(b).toBeTruthy();
    expect(c).toBeTruthy();

    // Same content grid - left edges aligned within 1px
    expect(Math.abs(h!.x - s!.x)).toBeLessThanOrEqual(1);
    
    // Same content grid - right edges aligned within 1px
    expect(Math.abs((h!.x + h!.width) - (s!.x + s!.width))).toBeLessThanOrEqual(1);

    // Brand is single-line & tappable (≥44px for accessibility)
    const tapH = await brand.evaluate(el => el.getBoundingClientRect().height);
    expect(tapH).toBeGreaterThanOrEqual(44);

    // No overflow on the right - CTA stays within container
    expect(c!.x + c!.width).toBeLessThanOrEqual(h!.x + h!.width + 1);

    // Brand text should not wrap
    const brandTextLines = await page.locator('header .brandText').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight) || rect.height;
      return Math.round(rect.height / lineHeight);
    });
    expect(brandTextLines).toBe(1);

    // Verify gradient styling is applied
    const gradientStyle = await page.locator('header .brandText').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        background: style.background,
        backgroundClip: style.backgroundClip || style.webkitBackgroundClip,
        color: style.color
      };
    });
    expect(gradientStyle.background).toContain('linear-gradient');
    expect(gradientStyle.backgroundClip).toBe('text');
    expect(gradientStyle.color).toContain('rgba(0, 0, 0, 0)'); // transparent
  }

  // Test interactive states
  await test.step('interactive states', async () => {
    const brandLink = page.locator('header a[aria-label="ShopLynk home"]');
    
    // Focus state
    await brandLink.focus();
    const isFocused = await brandLink.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);

    // Hover state
    await brandLink.hover();
    const hoverFilter = await page.locator('header .brandText').evaluate((el) => {
      return getComputedStyle(el).filter;
    });
    expect(hoverFilter).toContain('brightness');
  });

  // Test accessibility attributes
  await test.step('accessibility attributes', async () => {
    const brandLink = page.locator('header a[aria-label="ShopLynk home"]');
    
    // Should have proper aria-label
    const ariaLabel = await brandLink.getAttribute('aria-label');
    expect(ariaLabel).toBe('ShopLynk home');
    
    // Should be keyboard navigable
    await brandLink.press('Tab');
    const isStillFocused = await brandLink.evaluate((el) => document.activeElement === el);
    expect(isStillFocused).toBe(true);
  });
});

test('header brand typography consistency', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const brandText = page.locator('header .brandText');

  // Test font properties
  const fontProps = await brandText.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontSize: parseFloat(style.fontSize),
      letterSpacing: style.letterSpacing,
      whiteSpace: style.whiteSpace
    };
  });

  // Font family should be Inter
  expect(fontProps.fontFamily).toContain('Inter');
  
  // Font weight should be 700
  expect(fontProps.fontWeight).toBe('700');
  
  // Font size should be within clamp range (24px to 30px)
  expect(fontProps.fontSize).toBeGreaterThanOrEqual(24);
  expect(fontProps.fontSize).toBeLessThanOrEqual(30);
  
  // Should have nowrap to prevent line breaking
  expect(fontProps.whiteSpace).toBe('nowrap');
  
  // Should have negative letter spacing for tighter appearance
  expect(fontProps.letterSpacing).toContain('-');
});

test('header brand visual contrast', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const brandText = page.locator('header .brandText');

  // Test gradient colors
  const gradientColors = await brandText.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.background;
  });

  // Should contain the expected gradient colors
  expect(gradientColors).toContain('#3A49FF');
  expect(gradientColors).toContain('#1873FF');
  
  // Should be a linear gradient
  expect(gradientColors).toContain('linear-gradient');
});