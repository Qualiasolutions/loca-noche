import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should complete full booking process', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Loca Noche/);

    // Navigate to events
    await page.click('text=Explore Events');
    await page.waitForURL('/events');

    // Select first event
    await page.click('[data-testid="event-card"]:first-child');
    
    // Verify event details page
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="ticket-types"]')).toBeVisible();

    // Select ticket quantity
    await page.selectOption('[data-testid="quantity-select"]', '2');

    // Fill customer details
    await page.fill('[data-testid="customer-name"]', 'Test Customer');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.fill('[data-testid="customer-phone"]', '+357123456789');

    // Proceed to payment
    await page.click('[data-testid="proceed-payment"]');

    // Verify booking summary
    await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible();
    await expect(page.locator('text=Test Customer')).toBeVisible();
    await expect(page.locator('text=2 tickets')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/events');
    await page.click('[data-testid="event-card"]:first-child');
    
    // Try to proceed without filling details
    await page.click('[data-testid="proceed-payment"]');
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('should handle sold out events', async ({ page }) => {
    await page.goto('/events');
    
    // Mock sold out event
    await page.route('**/api/events', async route => {
      const json = {
        events: [{
          id: '1',
          title: 'Sold Out Event',
          capacity: 100,
          sold: 100,
          status: 'SOLD_OUT'
        }]
      };
      await route.fulfill({ json });
    });
    
    await page.reload();
    await expect(page.locator('text=Sold Out')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show admin interface
    await expect(page.locator('text=Loca Noche Admin')).toBeVisible();
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
  });

  test('should create new event', async ({ page }) => {
    await page.goto('/admin');
    
    // Navigate to create event tab
    await page.click('text=Create Event');
    
    // Fill event form
    await page.fill('[data-testid="event-title"]', 'Test Event');
    await page.fill('[data-testid="event-description"]', 'Test Description');
    await page.selectOption('[data-testid="event-category"]', 'CONCERT');
    await page.fill('[data-testid="event-date"]', '2025-12-31');
    await page.fill('[data-testid="start-time"]', '20:00');
    await page.fill('[data-testid="capacity"]', '500');
    
    // Create event
    await page.click('[data-testid="create-event"]');
    
    // Should show success message or redirect
    await page.waitForTimeout(2000);
  });
});

test.describe('Payment Integration', () => {
  test('should handle Viva Payment flow', async ({ page }) => {
    // Mock payment creation
    await page.route('**/api/payments/create', async route => {
      const json = {
        paymentId: 'payment-123',
        orderCode: 456789,
        paymentUrl: 'https://demo.vivapayments.com/web/checkout?ref=456789',
        amount: 100,
        currency: 'EUR'
      };
      await route.fulfill({ json });
    });

    await page.goto('/events');
    await page.click('[data-testid="event-card"]:first-child');

    // Complete booking form
    await page.selectOption('[data-testid="quantity-select"]', '1');
    await page.fill('[data-testid="customer-name"]', 'Test Customer');
    await page.fill('[data-testid="customer-email"]', 'test@example.com');
    await page.click('[data-testid="proceed-payment"]');

    // Should redirect to payment URL
    await page.waitForURL(/vivapayments\.com/);
  });

  test('should complete N8N payment flow and redirect to VivaPayments', async ({ page }) => {
    // Test the actual live site
    await page.goto('https://www.locanoche.com/tickets');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('Page loaded, checking for ticket selection...');

    // Look for ticket quantity controls
    const plusButtons = await page.locator('button:has-text("+")').count();

    if (plusButtons > 0) {
      // Select adult tickets (first + button)
      console.log('Found ticket controls, selecting adult ticket...');
      await page.locator('button:has-text("+")').first().click();
      await page.waitForTimeout(500);

      // Check if customer form is visible
      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.isVisible()) {
        console.log('Filling customer information...');
        await emailField.fill('test@example.com');

        const nameField = page.locator('input[name="name"]').first();
        if (await nameField.isVisible()) {
          await nameField.fill('Test Customer');
        }

        const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
        if (await phoneField.isVisible()) {
          await phoneField.fill('+35799123456');
        }
      }

      // Find and click purchase button
      const purchaseButton = page.locator('button:has-text("Purchase Tickets"), button:has-text("Proceed to Payment")').first();

      if (await purchaseButton.isVisible()) {
        console.log('Clicking purchase button...');
        await purchaseButton.click();

        // Wait for redirect or response
        const result = await Promise.race([
          page.waitForURL(/vivapayments\.com/, { timeout: 15000 }).then(() => 'success'),
          page.locator('text=/error|failed/i').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => 'error')
        ]).catch(() => 'timeout');

        if (result === 'success') {
          console.log('✅ Successfully redirected to VivaPayments!');
          const url = page.url();
          expect(url).toContain('vivapayments.com');
          console.log('Payment URL:', url);
        } else if (result === 'error') {
          const error = await page.locator('text=/error|failed/i').first().textContent();
          console.error('❌ Payment error:', error);
          throw new Error(`Payment failed: ${error}`);
        } else {
          console.log('Current URL:', page.url());
          await page.screenshot({ path: 'payment-timeout.png' });
          throw new Error('Timeout waiting for payment redirect');
        }
      }
    }
  });
});

test.describe('Mobile Experience', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Check responsive hero
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile booking flow
    await page.click('text=Get Tickets');
    await expect(page.locator('[data-testid="mobile-booking"]')).toBeVisible();
  });
});