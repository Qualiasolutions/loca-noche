import { vivaPaymentService } from './viva-payment'

interface N8NPaymentConfig {
  event1WebhookUrl: string
  event2WebhookUrl: string
}

interface PaymentRequest {
  eventId: string
  quantity: number
  ticketType: 'adult' | 'child'
  description?: string
}

interface PaymentRequestWithAmount {
  eventId: string
  totalAmount: number
  totalQuantity: number
  description?: string
}

interface PaymentResponse {
  success: boolean
  paymentUrl?: string
  orderCode?: string
  amount?: number
  quantity?: number
  ticketType?: string
  event?: string
  eventId?: string
  description?: string
  error?: string
}

export class N8NPaymentService {
  private getConfig(): N8NPaymentConfig {
    // Get environment variables at runtime, not build time
    // Add fallback URLs if env vars are not available
    return {
      event1WebhookUrl: process.env.N8N_EVENT1_WEBHOOK_URL || 'https://tasos8.app.n8n.cloud/webhook/loca-noche-event1-payment',
      event2WebhookUrl: process.env.N8N_EVENT2_WEBHOOK_URL || 'https://tasos8.app.n8n.cloud/webhook/loca-noche-event2-payment',
    }
  }

  // Direct Viva Payments integration (bypassing N8N for payment creation)
  private async getVivaAccessToken(): Promise<string> {
    const clientId = process.env.VIVA_CLIENT_ID || 'e9qc8r8d3jny5fznul8cezwsascfo2l3aqq2c6f105u47.apps.vivapayments.com'
    const clientSecret = process.env.VIVA_CLIENT_SECRET || 'cEv6S51r7hF1F96tyu0kuUY081f61E'
    
    console.log('🔑 Getting Viva access token...')
    
    const response = await fetch('https://accounts.vivapayments.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Viva auth failed:', response.status, errorText)
      throw new Error(`Failed to get Viva access token: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Got Viva access token')
    return data.access_token
  }

  private async createVivaPaymentDirect(
    accessToken: string,
    amount: number,
    quantity: number,
    sourceCode: string,
    eventName: string,
    eventId: string,
    customerData?: any
  ): Promise<any> {
    const orderPayload = {
      amount: Math.round(amount * 100), // Convert to cents
      sourceCode: sourceCode,
      customerTrns: eventName,
      paymentTimeout: 300,
      merchantTrns: `LocaNoche-Event${eventId}-${Date.now()}-Q${quantity}`,
    }
    
    console.log('💳 Creating Viva order:', orderPayload)
    
    const response = await fetch('https://api.vivapayments.com/checkout/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Viva order creation failed:', response.status, errorText)
      throw new Error(`Viva API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Viva order created:', result)
    return result
  }

  async createPaymentOrder(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const config = this.getConfig()
      // Determine which webhook URL to use based on event ID
      const webhookUrl = paymentRequest.eventId === '1'
        ? config.event1WebhookUrl
        : config.event2WebhookUrl

      if (!webhookUrl) {
        throw new Error(`N8N webhook URL not configured for event ${paymentRequest.eventId}`)
      }

      console.log(`Using N8N webhook URL: ${webhookUrl} for event ${paymentRequest.eventId}`)

      // Make request to N8N webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          quantity: paymentRequest.quantity,
          ticketType: paymentRequest.ticketType,
          description: paymentRequest.description || 'Oktoberfest Ticket Purchase'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`N8N webhook request failed: ${response.status} - ${errorText}`)
      }

      const result: PaymentResponse = await response.json()

      if (!result.success) {
        throw new Error(`Payment creation failed: ${result.error || 'Unknown error'}`)
      }

      return result
    } catch (error) {
      console.error('N8N payment creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  async createPaymentOrderWithAmount(paymentRequest: PaymentRequestWithAmount & { customerData?: any }): Promise<PaymentResponse> {
    try {
      console.log(`🎫 Creating payment for event ${paymentRequest.eventId}`)
      
      const eventName = this.getEventName(paymentRequest.eventId)
      const customerData = paymentRequest.customerData || {}

      // CHECK IF TEST/MOCK MODE
      const isTestMode = process.env.PAYMENT_MODE === 'test' || process.env.PAYMENT_MODE === 'mock'
      
      if (isTestMode) {
        console.log('🧪 TEST MODE: Creating mock payment...')
        const mockOrderCode = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        
        const mockResponse: PaymentResponse = {
          success: true,
          paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?orderId=${mockOrderCode}&eventId=${paymentRequest.eventId}&amount=${paymentRequest.totalAmount}&quantity=${paymentRequest.totalQuantity}&email=${encodeURIComponent(customerData.email || 'test@test.com')}&name=${encodeURIComponent(`${customerData.firstName} ${customerData.lastName}`)}`,
          orderCode: mockOrderCode,
          amount: paymentRequest.totalAmount,
          quantity: paymentRequest.totalQuantity,
          event: eventName,
          eventId: paymentRequest.eventId,
          description: paymentRequest.description || eventName,
        }
        
        console.log('✅ Mock payment created:', mockResponse)
        return mockResponse
      }

      // REAL VIVA PAYMENT
      console.log('💳 Using Viva Payment Service...')
      
      // Set the correct source code for this event before creating payment
      const sourceCode = this.getPaymentCode(paymentRequest.eventId)
      process.env.VIVA_SOURCE_CODE = sourceCode

      const paymentOrder = await vivaPaymentService.createPaymentOrder({
        amount: paymentRequest.totalAmount,
        bookingReference: `LN-${paymentRequest.eventId}-${Date.now()}`,
        customerEmail: customerData.email || 'customer@example.com',
        customerName: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim() || 'Customer',
        customerPhone: customerData.phone,
        description: paymentRequest.description || eventName,
      })
      
      console.log('✅ Created Viva payment order:', paymentOrder.orderCode)

      const paymentUrl = vivaPaymentService.getPaymentUrl(paymentOrder.orderCode)

      const fullResponse: PaymentResponse = {
        success: true,
        paymentUrl: paymentUrl,
        orderCode: paymentOrder.orderCode.toString(),
        amount: paymentRequest.totalAmount,
        quantity: paymentRequest.totalQuantity,
        event: eventName,
        eventId: paymentRequest.eventId,
        description: paymentRequest.description || eventName,
      }

      console.log('✅ Payment response ready:', fullResponse)
      return fullResponse
    } catch (error) {
      console.error('❌ Payment creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  getEventPrice(eventId: string, ticketType: 'adult' | 'child'): number {
    // Both events have the same pricing structure
    return ticketType === 'child' ? 5 : 10 // €5 for child, €10 for adult
  }

  calculateTotal(eventId: string, ticketType: 'adult' | 'child', quantity: number): number {
    const price = this.getEventPrice(eventId, ticketType)
    return price * quantity
  }

  getEventName(eventId: string): string {
    switch (eventId) {
      case '1':
        return 'Oktoberfest - Minus One'
      case '2':
        return 'Oktoberfest - Giannis Margaris'
      default:
        return 'Oktoberfest Event'
    }
  }

  getPaymentCode(eventId: string): string {
    switch (eventId) {
      case '1':
        return '1309'
      case '2':
        return '5711'
      default:
        return ''
    }
  }

  validatePaymentRequest(request: PaymentRequest): { valid: boolean; error?: string } {
    if (!request.eventId || !['1', '2'].includes(request.eventId)) {
      return { valid: false, error: 'Invalid event ID. Must be "1" or "2"' }
    }

    if (!request.quantity || request.quantity < 1 || request.quantity > 20) {
      return { valid: false, error: 'Quantity must be between 1 and 20' }
    }

    if (!request.ticketType || !['adult', 'child'].includes(request.ticketType)) {
      return { valid: false, error: 'Ticket type must be "adult" or "child"' }
    }

    return { valid: true }
  }
}

export const n8nPaymentService = new N8NPaymentService()