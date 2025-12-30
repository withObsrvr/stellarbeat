import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should render contact form correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Capture console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Log any console errors
    if (consoleErrors.length > 0) {
      console.log('=== Console Errors ===');
      consoleErrors.forEach(err => console.log(err));
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/contact-page-initial.png', fullPage: true });

    // Check form elements are visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check all form fields
    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const companyInput = page.locator('#company-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(companyInput).toBeVisible();
    await expect(serviceSelect).toBeVisible();
    await expect(messageTextarea).toBeVisible();
    await expect(consentCheckbox).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Submit button should be disabled initially
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit button when form is valid', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    // Submit button should be disabled initially
    await expect(submitButton).toBeDisabled();

    // Fill in all required fields
    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await serviceSelect.selectOption('host-validator');
    await messageTextarea.fill('I need help setting up my validator');
    await consentCheckbox.click();

    // Wait for reactivity
    await page.waitForTimeout(500);

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();

    // Take screenshot
    await page.screenshot({ path: 'test-results/contact-form-valid.png', fullPage: true });
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    // Fill form with invalid email
    await nameInput.fill('John Doe');
    await emailInput.fill('invalid-email');
    await serviceSelect.selectOption('host-validator');
    await messageTextarea.fill('Test message');
    await consentCheckbox.click();

    await page.waitForTimeout(500);

    // Submit button should be disabled due to invalid email
    await expect(submitButton).toBeDisabled();

    // Fix email
    await emailInput.fill('valid@example.com');
    await page.waitForTimeout(500);

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should require consent checkbox', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    // Fill all fields except consent
    await nameInput.fill('John Doe');
    await emailInput.fill('john@example.com');
    await serviceSelect.selectOption('help-setup');
    await messageTextarea.fill('I need setup assistance');

    await page.waitForTimeout(500);

    // Submit button should be disabled without consent
    await expect(submitButton).toBeDisabled();

    // Check consent
    await consentCheckbox.click();
    await page.waitForTimeout(500);

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled();
  });

  test('should submit form successfully with mocked backend', async ({ page }) => {
    // Mock the API endpoint to avoid actually sending emails
    await page.route('**/v1/contact', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const companyInput = page.locator('#company-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    // Fill out the form
    await nameInput.fill('Jane Smith');
    await emailInput.fill('jane@stellar.org');
    await companyInput.fill('Stellar Foundation');
    await serviceSelect.selectOption('both');
    await messageTextarea.fill('We need both hosting and setup assistance for our validator infrastructure.');
    await consentCheckbox.click();

    await page.waitForTimeout(500);

    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/contact-form-before-submit.png', fullPage: true });

    // Submit the form
    await submitButton.click();

    // Wait for success message
    await page.waitForTimeout(1000);

    // Check for success alert
    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Thank you for contacting us!');

    // Form should be reset
    await expect(nameInput).toHaveValue('');
    await expect(emailInput).toHaveValue('');
    await expect(companyInput).toHaveValue('');
    await expect(messageTextarea).toHaveValue('');

    // Take screenshot after submit
    await page.screenshot({ path: 'test-results/contact-form-after-submit.png', fullPage: true });
  });

  test('should display error message on failed submission', async ({ page }) => {
    // Mock the API endpoint to return an error
    await page.route('**/v1/contact', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const submitButton = page.locator('button[type="submit"]');

    // Fill out the form
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await serviceSelect.selectOption('general');
    await messageTextarea.fill('This is a test submission that should fail.');
    await consentCheckbox.click();

    await page.waitForTimeout(500);

    // Submit the form
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(1000);

    // Check for error alert
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Something went wrong');

    // Form should NOT be reset on error
    await expect(nameInput).toHaveValue('Test User');
    await expect(emailInput).toHaveValue('test@example.com');

    // Take screenshot
    await page.screenshot({ path: 'test-results/contact-form-error.png', fullPage: true });
  });

  test('should reset form when clear button is clicked', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('#name-input');
    const emailInput = page.locator('#email-input');
    const companyInput = page.locator('#company-input');
    const serviceSelect = page.locator('#service-interest-select');
    const messageTextarea = page.locator('#message-input');
    const consentCheckbox = page.locator('#consent-checkbox');
    const resetButton = page.locator('button[type="reset"]');

    // Fill out the form
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await companyInput.fill('Test Company');
    await serviceSelect.selectOption('host-validator');
    await messageTextarea.fill('Test message');
    await consentCheckbox.click();

    await page.waitForTimeout(500);

    // Click reset button
    await resetButton.click();

    await page.waitForTimeout(500);

    // All fields should be cleared
    await expect(nameInput).toHaveValue('');
    await expect(emailInput).toHaveValue('');
    await expect(companyInput).toHaveValue('');
    await expect(messageTextarea).toHaveValue('');

    // Take screenshot
    await page.screenshot({ path: 'test-results/contact-form-reset.png', fullPage: true });
  });
});
