interface VivaPaymentConfig {
  merchantId: string
  apiKey: string
  sourceCode: string
  clientId: string
  clientSecret: string
  isTestMode: boolean
  apiUrl: string
}

interface PaymentOrderRequest {
  amount: number
  customerTrns: string
  customer: {
    email: string
    fullName: string
    phone?: string
    countryCode: string
    requestLang: string
  }
  paymentNotification: boolean
  sourceCode: string
  merchantTrns: string
  tags?: string[]
}

interface PaymentOrderResponse {
  errorCode: number
  errorText: string
  timeStamp: string
  correlationId: string
  eventId: number
  orderCode: number
}

interface PaymentVerificationResponse {
  errorCode: number
  errorText: string
  timeStamp: string
  correlationId: string
  eventId: number
  orderCode: number
  statusId: string
  stateId: number
  date: string
  amount: number
  chargedAmount: number
  merchantTrns: string
  customerTrns: string
  email: string
  cardNumber: string
  cardBrand: string
  transactionId: string
}

export class VivaPaymentService {
  private config: VivaPaymentConfig

  constructor() {
    this.config = {
      merchantId: process.env.VIVA_MERCHANT_ID || '',
      apiKey: process.env.VIVA_API_KEY || '',
      sourceCode: process.env.VIVA_SOURCE_CODE || '',
      clientId: process.env.VIVA_CLIENT_ID || '',
      clientSecret: process.env.VIVA_CLIENT_SECRET || '',
      isTestMode: process.env.VIVA_TEST_MODE === 'true',
      apiUrl: process.env.VIVA_API_URL || 'https://demo-api.vivapayments.com',
    }
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64')

    const response = await fetch(`${this.config.apiUrl}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!response.ok) {
      throw new Error('Failed to get access token from Viva Payments')
    }

    const data = await response.json()
    return data.access_token
  }

  async createPaymentOrder(orderData: {
    amount: number
    bookingReference: string
    customerEmail: string
    customerName: string
    customerPhone?: string
    description: string
  }): Promise<PaymentOrderResponse> {
    try {
      const accessToken = await this.getAccessToken()
      
      const paymentRequest: PaymentOrderRequest = {
        amount: Math.round(orderData.amount * 100), // Convert to cents
        customerTrns: orderData.description,
        customer: {
          email: orderData.customerEmail,
          fullName: orderData.customerName,
          phone: orderData.customerPhone,
          countryCode: 'CY',
          requestLang: 'en-GB',
        },
        paymentNotification: true,
        sourceCode: this.config.sourceCode,
        merchantTrns: orderData.bookingReference,
        tags: ['loca-noche', 'ticket-booking'],
      }

      const response = await fetch(`${this.config.apiUrl}/checkout/v2/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paymentRequest),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Viva Payment API error: ${response.status} - ${errorText}`)
      }

      const result: PaymentOrderResponse = await response.json()
      
      if (result.errorCode !== 0) {
        throw new Error(`Viva Payment error: ${result.errorText}`)
      }

      return result
    } catch (error) {
      console.error('Viva Payment order creation error:', error)
      throw error
    }
  }

  async verifyPayment(orderCode: number): Promise<PaymentVerificationResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(
        `${this.config.apiUrl}/checkout/v2/transactions/${orderCode}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to verify payment: ${response.status}`)
      }

      const result: PaymentVerificationResponse = await response.json()
      return result
    } catch (error) {
      console.error('Payment verification error:', error)
      throw error
    }
  }

  getPaymentUrl(orderCode: number): string {
    const baseUrl = this.config.isTestMode 
      ? 'https://demo.vivapayments.com'
      : 'https://www.vivapayments.com'
    
    return `${baseUrl}/web/checkout?ref=${orderCode}`
  }

  async processRefund(transactionId: string, amount: number, reason: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()

      const refundRequest = {
        amount: Math.round(amount * 100), // Convert to cents
        actionUser: 'system',
        sourceCode: this.config.sourceCode,
        merchantTrns: `Refund: ${reason}`,
      }

      const response = await fetch(
        `${this.config.apiUrl}/checkout/v2/transactions/${transactionId}/refunds`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(refundRequest),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to process refund: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Refund processing error:', error)
      throw error
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implement webhook signature validation
    // This is a placeholder - implement actual signature verification
    return true
  }
}

export const vivaPaymentService = new VivaPaymentService()