import { test, expect } from '@playwright/test';

test.describe('E2E: Comprehensive Authentication & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Case 1: Customer Login with Empty Inputs (Validation Check)', async ({ page }) => {
    await page.goto('/customer/login');
    const emailInput = page.locator('input[type="email"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Click submit without entering values
    await submitBtn.click();

    // Verify HTML5 validation prevents submission or form stays on login page
    const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isEmailValid).toBe(false);
    await expect(page).toHaveURL(/.*\/customer\/login/);
  });

  test('Case 2: Customer Login with Malformed Email Format', async ({ page }) => {
    await page.goto('/customer/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('invalid-email-format');
    await passwordInput.fill('password123');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // HTML5 email constraint validation blocks submission
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('Case 3: Customer Login with Invalid Credentials', async ({ page }) => {
    await page.goto('/customer/login');
    await page.locator('input[type="email"]').fill('nonexistent.user999@thetiptop.in');
    await page.locator('input[type="password"]').fill('WrongPassword!123');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Error banner appears with failure message
    const errorBanner = page.locator('.bg-red-50').first();
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
  });

  test('Case 4: Forgot Password Modal Lifecycle', async ({ page }) => {
    await page.goto('/customer/login');

    // Click "Forgot password?"
    const forgotBtn = page.getByRole('button', { name: /forgot password/i });
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    // Modal dialog opens
    const modalHeading = page.locator('h3:has-text("Reset Password")').first();
    await expect(modalHeading).toBeVisible();

    // Fill reset email inside modal
    const modalEmailInput = page.locator('div.fixed input[type="email"]');
    await expect(modalEmailInput).toBeVisible();
    await modalEmailInput.fill('sample@thetiptop.in');

    // Cancel / Close button works
    const cancelBtn = page.locator('div.fixed button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal closes
    await expect(modalHeading).not.toBeVisible();
  });

  test('Case 5: Password Reset Token Form Mismatch Validation', async ({ page }) => {
    await page.goto('/reset-password/sample-verification-token');

    // Password reset form elements
    const newPassInput = page.locator('input[placeholder="Min 8 characters"]');
    const confirmPassInput = page.locator('input[placeholder="Repeat new password"]');
    await expect(newPassInput).toBeVisible();

    // Mismatched passwords
    await newPassInput.fill('NewSecurePassword123!');
    await confirmPassInput.fill('DifferentMismatch456!');

    const saveBtn = page.locator('button[type="submit"]');
    await saveBtn.click();

    // Error for password mismatch appears
    const mismatchNotice = page.locator('text=Passwords do not match').first();
    await expect(mismatchNotice).toBeVisible();
  });

  test('Case 6: Admin Login Empty Submission Validation', async ({ page }) => {
    await page.goto('/signin');
    await expect(page).toHaveTitle(/Sign In | The Tip Top/i);

    // Empty submission triggers required validation
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Error message prompt displayed
    const errorNotice = page.locator('.bg-red-50').first();
    await expect(errorNotice).toBeVisible();
  });

  test('Case 7: Customer Protected Route Redirection (Unauthenticated)', async ({ page }) => {
    // Protected customer route
    await page.goto('/customer/orders');

    // Redirected to /customer/login
    await expect(page).toHaveURL(/.*\/customer\/login/);
  });

  test('Case 8: Admin Protected Route Redirection (Unauthenticated)', async ({ page }) => {
    // Protected admin route
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/.*\/signin/);

    await page.goto('/admin/insights');
    await expect(page).toHaveURL(/.*\/signin/);
  });
});
