"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Home, Mail, Ticket, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoHeader } from "@/components/logo-header"

function PaymentSuccessContent() {
  const [countdown, setCountdown] = useState(15)
  const [ticketStatus, setTicketStatus] = useState<'generating' | 'sent' | 'error'>('generating')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Trigger ticket generation when page loads
  useEffect(() => {
    const triggerTicketGeneration = async () => {
      try {
        // Get payment data from URL params
        const orderId = searchParams.get('orderId')
        const eventId = searchParams.get('eventId') || 'event1'
        const customerEmail = searchParams.get('customerEmail')
        const customerName = searchParams.get('customerName')
        const totalAmount = searchParams.get('totalAmount')
        const totalQuantity = searchParams.get('totalQuantity')
        const adultTickets = searchParams.get('adultTickets')
        const childTickets = searchParams.get('childTickets')

        if (!orderId || !customerEmail) {
          console.warn('Missing payment data, skipping ticket generation')
          setTicketStatus('error')
          return
        }

        // Call N8N webhook to generate tickets
        const response = await fetch('https://tasos8.app.n8n.cloud/webhook/loca-noche-payment-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            eventId,
            customerEmail,
            customerName: decodeURIComponent(customerName || ''),
            totalAmount: parseFloat(totalAmount || '0'),
            totalQuantity: parseInt(totalQuantity || '1'),
            adultTickets: parseInt(adultTickets || '0'),
            childTickets: parseInt(childTickets || '0'),
            status: 'SUCCESS'
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Tickets generated successfully:', result)
          setTicketStatus('sent')
        } else {
          console.error('Failed to generate tickets:', response.statusText)
          setTicketStatus('error')
        }
      } catch (error) {
        console.error('Error generating tickets:', error)
        setTicketStatus('error')
      }
    }

    triggerTicketGeneration()
  }, [searchParams])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-black to-yellow-900/30"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <nav className="flex items-center justify-center">
            <LogoHeader />
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center min-h-[75vh] sm:min-h-[80vh]">
            <div className="text-center max-w-2xl mx-auto">
              
              {/* Success Icon */}
              <div className="mb-8 sm:mb-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-green-500 blur-2xl opacity-40 rounded-full scale-150"></div>
                  <CheckCircle className="relative w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 text-green-500 mx-auto animate-pulse" />
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent">
                  PAYMENT SUCCESSFUL
                </span>
              </h1>

              <div className="h-0.5 sm:h-1 w-20 sm:w-32 bg-gradient-to-r from-green-500 to-yellow-400 mx-auto mb-6 sm:mb-8 rounded-full"></div>

              {/* Success Details */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-4 sm:mb-6 font-light leading-relaxed px-2">
                Your tickets have been <span className="text-white font-semibold">successfully purchased!</span>
              </p>

              {/* Ticket Generation Status */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 max-w-xl mx-auto backdrop-blur-sm">
                {ticketStatus === 'generating' && (
                  <div className="flex items-center justify-center space-x-3 text-yellow-400">
                    <Clock className="w-6 h-6 animate-spin" />
                    <span className="text-lg font-medium">Generating your tickets...</span>
                  </div>
                )}

                {ticketStatus === 'sent' && (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-3 text-green-400">
                      <Mail className="w-6 h-6" />
                      <span className="text-lg font-medium">Tickets sent to your email!</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                      <Ticket className="w-4 h-4" />
                      <span>Each ticket includes a unique QR code for venue entry</span>
                    </div>
                  </div>
                )}

                {ticketStatus === 'error' && (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-3 text-red-400">
                      <span className="text-lg font-medium">⚠️ Ticket generation error</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Don't worry! Your payment was successful. Please contact support at{' '}
                      <a href="mailto:support@locanoche.cy" className="text-green-400 hover:text-green-300">
                        support@locanoche.cy
                      </a>
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-12 max-w-xl mx-auto px-2">
                {ticketStatus === 'sent' ? (
                  <>Check your email for your tickets with QR codes. Present them at the venue entrance. See you at the event!</>
                ) : ticketStatus === 'generating' ? (
                  <>Please wait while we generate your tickets with QR codes. This usually takes a few seconds.</>
                ) : (
                  <>Your payment was processed successfully. We'll send your tickets shortly via email.</>
                )}
              </p>

              {/* Countdown and CTA */}
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <p className="text-gray-400 text-sm sm:text-base mb-2">
                    Redirecting to homepage in
                  </p>
                  <div className="text-4xl sm:text-5xl font-bold text-yellow-400 mb-4">
                    {countdown}
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/")}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 border-0 rounded-xl group"
                >
                  <Home className="mr-2 sm:mr-3 w-5 sm:w-6 h-5 sm:h-6 group-hover:rotate-12 transition-transform" />
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}