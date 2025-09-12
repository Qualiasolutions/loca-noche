import { VivaPaymentService } from '@/lib/payment/viva-payment'

// Mock fetch for testing
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('VivaPaymentService', () => {
  let vivaService: VivaPaymentService

  beforeEach(() => {
    vivaService = new VivaPaymentService({
      merchantId: 'test-merchant',
      apiKey: 'test-api-key',
      sourceCode: 'test-source',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      isTestMode: true,
      apiUrl: 'https://demo-api.vivapayments.com'
    })
    mockFetch.mockClear()
  })

  describe('createPaymentOrder', () => {
    it('should create a payment order successfully', async () => {
      // Mock access token response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' })
        })
        // Mock payment order response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errorCode: 0,
            errorText: '',
            timeStamp: '2025-01-01T00:00:00Z',
            correlationId: 'test-correlation-id',
            eventId: 123,
            orderCode: 456
          })
        })

      const orderData = {
        amount: 100,
        bookingReference: 'LN123ABC',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        description: 'Test event tickets'
      }

      const result = await vivaService.createPaymentOrder(orderData)

      expect(result).toBeDefined()
      expect(result.errorCode).toBe(0)
      expect(result.orderCode).toBe(456)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle payment order creation failure', async () => {
      // Mock access token response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' })
        })
        // Mock failed payment order response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errorCode: 100,
            errorText: 'Invalid request',
            timeStamp: '2025-01-01T00:00:00Z',
            correlationId: 'test-correlation-id',
            eventId: 0,
            orderCode: 0
          })
        })

      const orderData = {
        amount: 100,
        bookingReference: 'LN123ABC',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        description: 'Test event tickets'
      }

      await expect(vivaService.createPaymentOrder(orderData)).rejects.toThrow('Viva Payment error: Invalid request')
    })
  })

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      // Mock access token response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' })
        })
        // Mock payment verification response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errorCode: 0,
            statusId: 'F',
            stateId: 6,
            amount: 10000,
            chargedAmount: 10000,
            transactionId: 'txn-123'
          })
        })

      const result = await vivaService.verifyPayment(456)

      expect(result).toBeDefined()
      expect(result.stateId).toBe(6)
      expect(result.amount).toBe(10000)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle verification API failure', async () => {
      // Mock access token response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' })
        })
        // Mock failed verification response
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })

      await expect(vivaService.verifyPayment(456)).rejects.toThrow('Failed to verify payment: 404')
    })
  })

  describe('getPaymentUrl', () => {
    it('should generate correct payment URL for test mode', () => {
      const orderCode = 123456
      const url = vivaService.getPaymentUrl(orderCode)

      expect(url).toBe('https://demo.vivapayments.com/web/checkout?ref=123456')
    })
  })

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      // Mock access token response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'mock-access-token' })
        })
        // Mock refund response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            refundId: 'refund-123',
            amount: 5000,
            status: 'Approved'
          })
        })

      const result = await vivaService.processRefund('txn-123', 50, 'Customer request')

      expect(result).toBeDefined()
      expect(result.refundId).toBe('refund-123')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})