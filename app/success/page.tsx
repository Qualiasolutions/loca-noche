"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoHeader } from "@/components/logo-header"

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(10)
  const router = useRouter()

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
              
              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-12 max-w-xl mx-auto px-2">
                Check your email for confirmation and ticket details. See you at the event!
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