"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ExternalLink, X, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface PaymentProcessingModalProps {
  isOpen: boolean
  onClose: () => void
  paymentUrl: string
  orderId: string
  eventId: string
  customerEmail: string
  customerName: string
  totalAmount: number
  totalQuantity: number
  adultTickets: number
  childTickets: number
}

type PaymentStatus = 'processing' | 'confirmed' | 'failed' | 'timeout'

export function PaymentProcessingModal({
  isOpen,
  onClose,
  paymentUrl,
  orderId,
  eventId,
  customerEmail,
  customerName,
  totalAmount,
  totalQuantity,
  adultTickets,
  childTickets
}: PaymentProcessingModalProps) {
  const [status, setStatus] = useState<PaymentStatus>('processing')
  const [countdown, setCountdown] = useState(600) // 10 minutes
  const [isChecking, setIsChecking] = useState(false)

  // Poll for payment confirmation
  useEffect(() => {
    if (!isOpen || status !== 'processing') return

    const checkPaymentStatus = async () => {
      try {
        setIsChecking(true)
        const response = await fetch(`/api/payments/status/${orderId}`)
        const data = await response.json()

        if (data.status === 'confirmed') {
          setStatus('confirmed')
          // Redirect to success page after confirmation
          setTimeout(() => {
            const successUrl = new URL('/success', window.location.origin)
            successUrl.searchParams.set('orderId', orderId)
            successUrl.searchParams.set('eventId', eventId)
            successUrl.searchParams.set('customerEmail', customerEmail)
            successUrl.searchParams.set('customerName', encodeURIComponent(customerName))
            successUrl.searchParams.set('totalAmount', totalAmount.toString())
            successUrl.searchParams.set('totalQuantity', totalQuantity.toString())
            successUrl.searchParams.set('adultTickets', adultTickets.toString())
            successUrl.searchParams.set('childTickets', childTickets.toString())

            window.location.href = successUrl.toString()
          }, 2000)
        } else if (data.status === 'failed') {
          setStatus('failed')
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately, then every 5 seconds
    checkPaymentStatus()
    const interval = setInterval(checkPaymentStatus, 5000)

    return () => clearInterval(interval)
  }, [isOpen, status, orderId, eventId, customerEmail, customerName, totalAmount, totalQuantity, adultTickets, childTickets])

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) {
      if (countdown <= 0) {
        setStatus('timeout')
      }
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, countdown])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleOpenPayment = () => {
    window.open(paymentUrl, '_blank')
  }

  const handleRetryPayment = () => {
    setStatus('processing')
    setCountdown(600)
    handleOpenPayment()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-700 text-white max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {status === 'processing' && (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                    Processing Payment
                  </>
                )}
                {status === 'confirmed' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Payment Confirmed!
                  </>
                )}
                {status === 'failed' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Payment Failed
                  </>
                )}
                {status === 'timeout' && (
                  <>
                    <Clock className="w-5 h-5 text-orange-400" />
                    Payment Timeout
                  </>
                )}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 p-1 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'processing' && (
            <>
              <div className="text-center space-y-2">
                <p className="text-gray-300">
                  Complete your payment in the Viva Payments window that opened.
                </p>
                <p className="text-sm text-gray-400">
                  We'll automatically detect when your payment is complete.
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-mono font-bold text-yellow-400">
                  {formatTime(countdown)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Time remaining to complete payment
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleOpenPayment}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Payment Page
                </Button>

                {isChecking && (
                  <div className="text-center text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Checking payment status...
                  </div>
                )}
              </div>

              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <strong>Important:</strong> Keep this window open while you complete your payment.
                  Don't close your browser.
                </p>
              </div>
            </>
          )}

          {status === 'confirmed' && (
            <div className="text-center space-y-4">
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-semibold">
                  Payment Successfully Confirmed!
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Redirecting you to your tickets...
                </p>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center space-y-4">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-red-300 font-semibold">
                  Payment Could Not Be Completed
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Your payment was declined or cancelled. Please try again.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRetryPayment}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status === 'timeout' && (
            <div className="text-center space-y-4">
              <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
                <Clock className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                <p className="text-orange-300 font-semibold">
                  Payment Session Expired
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Your payment session has timed out. Please start a new booking.
                </p>
              </div>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Start New Booking
              </Button>
            </div>
          )}

          {/* Order Details */}
          <div className="text-xs text-gray-400 border-t border-gray-700 pt-3 space-y-1">
            <p>Order ID: {orderId}</p>
            <p>Amount: €{totalAmount}</p>
            <p>Email: {customerEmail}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}