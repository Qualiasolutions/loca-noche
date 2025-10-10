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
  private config: N8NPaymentConfig

  constructor() {
    this.config = {
      event1WebhookUrl: process.env.N8N_EVENT1_WEBHOOK_URL || '',
      event2WebhookUrl: process.env.N8N_EVENT2_WEBHOOK_URL || '',
    }

    console.log('N8N Config loaded:', {
      event1Url: this.config.event1WebhookUrl ? 'SET' : 'MISSING',
      event2Url: this.config.event2WebhookUrl ? 'SET' : 'MISSING',
      event1ActualUrl: this.config.event1WebhookUrl,
      event2ActualUrl: this.config.event2WebhookUrl
    })
  }

  async createPaymentOrder(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Determine which webhook URL to use based on event ID
      const webhookUrl = paymentRequest.eventId === '1'
        ? this.config.event1WebhookUrl
        : this.config.event2WebhookUrl

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
      // Determine which webhook URL to use based on event ID
      const webhookUrl = paymentRequest.eventId === '1'
        ? this.config.event1WebhookUrl
        : this.config.event2WebhookUrl

      if (!webhookUrl) {
        throw new Error(`N8N webhook URL not configured for event ${paymentRequest.eventId}`)
      }

      console.log(`Using N8N webhook URL: ${webhookUrl} for event ${paymentRequest.eventId}`)

      // Make request to N8N webhook with pre-calculated amount
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          totalAmount: paymentRequest.totalAmount,
          totalQuantity: paymentRequest.totalQuantity,
          description: paymentRequest.description || 'Mixed Oktoberfest Ticket Purchase',
          preCalculated: true, // Flag to indicate amount is pre-calculated
          customerData: paymentRequest.customerData // Include customer data
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