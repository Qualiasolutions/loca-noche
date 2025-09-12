import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  verifyToken, 
  generateBookingReference 
} from '@/lib/auth/auth'

describe('Auth utilities', () => {
  describe('Password hashing', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50)
    })

    it('should verify a correct password', async () => {
      const password = 'testpassword123'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hashedPassword = await hashPassword(password)
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT token handling', () => {
    const mockPayload = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'CUSTOMER'
    }

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify a valid JWT token', () => {
      const token = generateToken(mockPayload)
      const decoded = verifyToken(token)
      
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw error for invalid JWT token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyToken(invalidToken)).toThrow()
    })
  })

  describe('Booking reference generation', () => {
    it('should generate a booking reference', () => {
      const reference = generateBookingReference()
      
      expect(reference).toBeDefined()
      expect(reference).toMatch(/^LN[A-Z0-9]+$/)
      expect(reference.length).toBeGreaterThan(5)
    })

    it('should generate unique booking references', () => {
      const reference1 = generateBookingReference()
      const reference2 = generateBookingReference()
      
      expect(reference1).not.toBe(reference2)
    })
  })
})