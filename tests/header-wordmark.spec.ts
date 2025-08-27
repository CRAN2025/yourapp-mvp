import { test, expect } from '@playwright/test';

test('header wordmark alignment & a11y', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  const headerInner = page.locator('header [class*="mx-auto"]');
  const heroInner = page.locator('section#signup .glass.heroGlass > .mx-auto');
  const brandLink = page.locator('header a[aria-label="ShopLynk home"]');
  const brandText = page.locator('header .brandText');
  const cta = page.locator('header button:has-text("Create Store")');

  // Viewports to check
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    
    // Wait for layout to stabilize after resize
    await page.waitForTimeout(100);
    
    const hRect = await headerInner.boundingBox();
    const heroRect = await heroInner.boundingBox();
    const brandLinkRect = await brandLink.boundingBox();
    const ctaRect = await cta.boundingBox();

    // Assert containers exist
    expect(hRect).toBeTruthy();
    expect(heroRect).toBeTruthy();
    expect(brandLinkRect).toBeTruthy();
    expect(ctaRect).toBeTruthy();

    // Same left grid line (within 1px tolerance)
    expect(Math.abs(hRect!.x - heroRect!.x)).toBeLessThanOrEqual(1);
    
    // Same right grid line (within 1px tolerance)
    expect(Math.abs((hRect!.x + hRect!.width) - (heroRect!.x + heroRect!.width))).toBeLessThanOrEqual(1);

    // Brand link tap target height ≥ 44px for accessibility
    expect(brandLinkRect!.height).toBeGreaterThanOrEqual(44);

    // No wrapping: wordmark single line
    const brandLines = await brandText.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight) || rect.height;
      return Math.round(rect.height / lineHeight);
    });
    expect(brandLines).toBe(1);

    // CTA doesn't overflow container
    expect(ctaRect!.x + ctaRect!.width).toBeLessThanOrEqual(hRect!.x + hRect!.width + 1);

    // Wordmark styling verification
    const wordmarkStyles = await brandText.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        fontWeight: style.fontWeight,
        whiteSpace: style.whiteSpace,
        background: style.background,
        backgroundClip: style.backgroundClip || style.webkitBackgroundClip
      };
    });

    // Font weight should be 750
    expect(wordmarkStyles.fontWeight).toBe('750');
    
    // Should have nowrap to prevent line breaking
    expect(wordmarkStyles.whiteSpace).toBe('nowrap');
    
    // Should have gradient background with text clipping
    expect(wordmarkStyles.background).toContain('linear-gradient');
    expect(wordmarkStyles.backgroundClip).toBe('text');
  }

  // Test accessibility features
  await test.step('accessibility checks', async () => {
    // Brand link should be focusable
    await brandLink.focus();
    const isFocused = await brandLink.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);

    // Should have proper aria-label
    const ariaLabel = await brandLink.getAttribute('aria-label');
    expect(ariaLabel).toBe('ShopLynk home');

    // Hover state check
    await brandLink.hover();
    const hoverFilter = await brandText.evaluate((el) => {
      return getComputedStyle(el).filter;
    });
    expect(hoverFilter).toContain('brightness');
  });

  // Test contrast and visual quality
  await test.step('visual quality checks', async () => {
    // Ensure wordmark is visible and has proper gradient
    const isVisible = await brandText.isVisible();
    expect(isVisible).toBe(true);

    // Check for proper gradient colors
    const gradientColors = await brandText.evaluate((el) => {
      const style = getComputedStyle(el);
      return style.background;
    });
    expect(gradientColors).toContain('#3E4CFF');
    expect(gradientColors).toContain('#1A7BFF');
  });
});

test('header wordmark responsive behavior', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const brandText = page.locator('header .brandText');

  // Test font size scaling across viewports
  const viewportSizes = [
    { width: 390, expectedMinSize: 24 },   // Mobile
    { width: 768, expectedMinSize: 24 },   // Tablet
    { width: 1024, expectedMinSize: 24 },  // Desktop small
    { width: 1440, expectedMinSize: 24 }   // Desktop large
  ];

  for (const { width, expectedMinSize } of viewportSizes) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);

    const fontSize = await brandText.evaluate((el) => {
      return parseFloat(getComputedStyle(el).fontSize);
    });

    // Font size should be at least the minimum from clamp()
    expect(fontSize).toBeGreaterThanOrEqual(expectedMinSize);
    
    // Font size should not exceed 30px (max from clamp)
    expect(fontSize).toBeLessThanOrEqual(30);
  }
});