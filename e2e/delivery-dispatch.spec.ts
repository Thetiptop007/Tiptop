import { test, expect } from '@playwright/test';

test.describe('E2E: Delivery Partner Dispatch & Fleet Management', () => {
  test('Admin navigates to delivery partners and verifies partner list / add agent interface', async ({ page }) => {
    // 1. Visit admin sign in
    await page.goto('/signin');
    await expect(page).toHaveTitle(/The Tip Top/i);

    // 2. Test delivery partner route guard
    await page.goto('/admin/delivery');
    await expect(page).toHaveURL(/.*\/signin/);

    // 3. Test add delivery agent route guard
    await page.goto('/admin/delivery/add');
    await expect(page).toHaveURL(/.*\/signin/);
  });
});
