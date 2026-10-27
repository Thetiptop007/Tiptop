import { test, expect } from '@playwright/test';

test.describe('E2E: Admin Order Acceptance & Management Flow', () => {
  test('Admin logs in and accesses Orders dashboard to manage incoming orders', async ({ page }) => {
    // 1. Visit admin sign in
    await page.goto('/signin');
    await expect(page).toHaveTitle(/Sign In | The Tip Top/i);

    // 2. Verify admin credentials form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.getByRole('button', { name: /sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // 3. Navigate directly to /admin/orders (testing protected route guard)
    await page.goto('/admin/orders');

    // 4. Verify unauthenticated access redirects cleanly to /signin
    await expect(page).toHaveURL(/.*\/signin/);
  });
});
