import { test, expect, Page } from '@playwright/test';

const TEST_SELLER_ID = 'test-seller-2025-01';

test.describe('Storefront Public', () => {
  
  test('loads storefront with no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to test storefront
    await page.goto(`/store/${TEST_SELLER_ID}`);
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="storefront-loaded"]', { timeout: 10000 });
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
    
    // Verify store loaded
    await expect(page).toHaveTitle(/Premium Electronics Store/);
  });

  test('desktop WhatsApp click opens new tab to web.whatsapp.com', async ({ page, context }) => {
    // Set desktop user agent
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Navigate to storefront
    await page.goto(`/store/${TEST_SELLER_ID}`);
    
    // Wait for products to load
    await page.waitForSelector('[data-testid^="card-product-"]', { timeout: 10000 });
    
    // Find first product card
    const productCard = page.locator('[data-testid^="card-product-"]').first();
    
    // Hover to reveal WhatsApp button (desktop behavior)
    await productCard.hover();
    
    // Wait for WhatsApp button to appear
    const whatsappButton = productCard.locator('[data-testid^="button-whatsapp-"]');
    await expect(whatsappButton).toBeVisible();
    
    // Listen for new tab
    const pagePromise = context.waitForEvent('page');
    
    // Click WhatsApp button
    await whatsappButton.click();
    
    // Get new tab
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    
    // Verify URL is WhatsApp Web
    const url = newPage.url();
    expect(url).toContain('web.whatsapp.com/send');
    expect(url).toContain('phone=233123456789');
    expect(url).toContain('text=');
  });

  test('mobile WhatsApp click opens wa.me URL', async ({ page }) => {
    // Set mobile user agent
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to storefront
    await page.goto(`/store/${TEST_SELLER_ID}`);
    
    // Wait for products to load
    await page.waitForSelector('[data-testid^="card-product-"]', { timeout: 10000 });
    
    // Find first product card WhatsApp button (should be always visible on mobile)
    const whatsappButton = page.locator('[data-testid^="card-product-"] [data-testid^="button-whatsapp-"]').first();
    await expect(whatsappButton).toBeVisible();
    
    // Click and verify wa.me URL would be opened
    await whatsappButton.click();
    
    // On mobile, wa.me URL should trigger app opening
    // Note: In test environment, this will likely open in same tab
    await page.waitForURL(/wa\.me.*/, { timeout: 5000 });
    
    const url = page.url();
    expect(url).toContain('wa.me/233123456789');
    expect(url).toContain('text=');
  });

});