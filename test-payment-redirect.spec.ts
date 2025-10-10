import { test, expect } from '@playwright/test'

test('Payment flow redirects to VivaPayments', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text())
    }
  })

  // Log network requests
  page.on('request', request => {
    if (request.url().includes('api/checkout') || request.url().includes('n8n') || request.url().includes('viva')) {
      console.log('Request to:', request.url())
    }
  })

  // Log network responses
  page.on('response', response => {
    if (response.url().includes('api/checkout') || response.url().includes('n8n') || response.url().includes('viva')) {
      console.log('Response from:', response.url(), 'Status:', response.status())
    }
  })

  console.log('1. Navigating to tickets page...')
  await page.goto('https://www.locanoche.com/tickets', { waitUntil: 'networkidle' })

  console.log('2. Selecting Event 1 (Minus One)...')
  await page.click('[data-event="1"]')
  await page.waitForTimeout(1000)

  console.log('3. Adding 1 adult ticket...')
  await page.click('[data-event="1"] button:has-text("+")')
  await page.waitForTimeout(500)

  console.log('4. Filling customer information...')
  await page.fill('input[name="firstName"]', 'Test')
  await page.fill('input[name="lastName"]', 'User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="phone"]', '+35799123456')

  console.log('5. Checking agree to terms...')
  await page.check('input[name="agreeToTerms"]')

  console.log('6. Clicking Proceed to Payment...')
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/checkout'), { timeout: 30000 }),
    page.click('button:has-text("Proceed to Payment")')
  ])

  const responseData = await response.json()
  console.log('Checkout API Response:', JSON.stringify(responseData, null, 2))

  // Check if we got a payment URL
  if (responseData.paymentUrl) {
    console.log('\n✅ SUCCESS! Got payment URL:', responseData.paymentUrl)

    // Check if it's a VivaPayments URL
    if (responseData.paymentUrl.includes('vivapayments.com')) {
      console.log('✅ Payment URL is from VivaPayments!')
      console.log('✅ Order Code:', responseData.orderCode)

      // Navigate to the payment URL
      console.log('\n7. Redirecting to VivaPayments...')
      await page.goto(responseData.paymentUrl)
      await page.waitForLoadState('networkidle')

      // Check if we're on VivaPayments
      const currentUrl = page.url()
      console.log('Current URL:', currentUrl)

      if (currentUrl.includes('vivapayments.com')) {
        console.log('✅ Successfully redirected to VivaPayments checkout!')

        // Take a screenshot for verification
        await page.screenshot({ path: 'vivapayments-redirect.png', fullPage: false })
        console.log('Screenshot saved as vivapayments-redirect.png')
      }
    }
  } else {
    console.log('❌ No payment URL received')
    console.log('Full response:', responseData)
  }
})