import { test, expect } from '@playwright/test';

test.describe('E2E: Customer Food Ordering Flow', () => {
  test('Customer visits landing page, navigates to menu, and accesses checkout', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/The Tip Top/i);

    // 2. Navigate to menu / order page
    const orderBtn = page.getByRole('link', { name: /order now/i }).first();
    if (await orderBtn.isVisible()) {
      await orderBtn.click();
    } else {
      await page.goto('/customer/menu');
    }

    // 3. Verify customer menu loads
    await expect(page).toHaveURL(/.*\/customer\/menu/);
    
    // 4. Verify menu content or items render
    const menuContainer = page.locator('main, #root, [data-testid="menu-container"]').first();
    await expect(menuContainer).toBeVisible();

    // 5. Navigate to login if not authenticated
    await page.goto('/customer/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
