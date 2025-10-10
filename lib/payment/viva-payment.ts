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
    // Use the exact same format as n8n workflows (which work!)
    const tokenUrl = 'https://accounts.vivapayments.com/connect/token'
    
    const formBody = `grant_type=client_credentials&client_id=${encodeURIComponent(this.config.clientId)}&client_secret=${encodeURIComponent(this.config.clientSecret)}`

    console.log('🔑 Requesting Viva access token...')

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Viva token error:', response.status, errorText)
      throw new Error(`Failed to get access token from Viva Payments: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Got Viva access token successfully')
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
      
      // Add webhook URL if configured (for success notifications)
      const webhookUrl = process.env.N8N_SUCCESS_WEBHOOK_URL || process.env.VIVA_WEBHOOK_URL
      if (webhookUrl) {
        console.log('📞 Configuring Viva webhook:', webhookUrl)
        // Note: Viva webhooks are configured in dashboard, not per-request
        // But we log it here for reference
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

      const result: any = await response.json()
      
      console.log('📦 Viva response:', JSON.stringify(result))
      
      // Check for errors - Viva can return errors in different formats
      if (result.ErrorCode || result.errorCode) {
        const errorCode = result.ErrorCode || result.errorCode
        const errorMsg = result.ErrorText || result.errorText || result.message || `Error code ${errorCode}`
        console.error('❌ Viva error:', errorMsg)
        throw new Error(`Viva Payment error: ${errorMsg}`)
      }
      
      // Check if we got an order code (success indicator)
      if (!result.OrderCode && !result.orderCode) {
        console.error('❌ No order code in response:', result)
        throw new Error('Viva Payment response missing order code')
      }

      console.log('✅ Payment order created successfully:', result.OrderCode || result.orderCode)
      return result as PaymentOrderResponse
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