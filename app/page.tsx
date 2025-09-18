"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket, Sparkles } from "lucide-react"
import Image from "next/image"
import { EnhancedLoadingScreen } from "@/components/enhanced-loading-screen"
import { LogoHeader } from "@/components/logo-header"

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true)

  if (showLoading) {
    return <EnhancedLoadingScreen onComplete={() => setShowLoading(false)} />
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <Image
          src="/entertainment-bg.jpg"
          alt="Entertainment background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-yellow-900/30"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 sm:w-80 h-56 sm:h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <nav className="flex items-center justify-between">
            <LogoHeader />
            
            {/* Contact info */}
            <div className="hidden sm:block text-xs sm:text-sm text-gray-400">
              <span className="text-yellow-400 font-bold">99144630</span>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center min-h-[75vh] sm:min-h-[80vh]">
            <div className="text-center max-w-4xl mx-auto">
              
              {/* Brand Statement */}
              <div className="mb-8 sm:mb-12">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 sm:mb-6 leading-tight sm:leading-none">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    PREMIUM
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent animate-gradient-x">
                    ENTERTAINMENT
                  </span>
                </h1>
                <div className="h-0.5 sm:h-1 w-20 sm:w-32 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto mb-6 sm:mb-8 rounded-full"></div>
              </div>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 mb-3 sm:mb-4 font-light max-w-3xl mx-auto leading-relaxed px-2">
                Experience <span className="text-white font-semibold">unforgettable live concerts</span> and 
                <span className="text-yellow-400 font-semibold"> cultural events</span> across Cyprus
              </p>
              
              <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-12 sm:mb-16 max-w-2xl mx-auto px-2">
                Cyprus's premier entertainment platform bringing you the best live experiences
              </p>

              {/* Main CTA Button */}
              <div className="relative inline-block mb-8 sm:mb-0">
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-400 blur-lg opacity-60 rounded-xl sm:rounded-2xl scale-110"></div>
                
                <Link href="/tickets">
                  <Button 
                    size="lg" 
                    className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 text-lg sm:text-xl md:text-2xl font-bold shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 border-0 rounded-xl sm:rounded-2xl group"
                  >
                    <Ticket className="mr-2 sm:mr-3 md:mr-4 w-5 sm:w-6 md:w-8 h-5 sm:h-6 md:h-8 group-hover:rotate-12 transition-transform" />
                    TICKETS
                    <Sparkles className="ml-2 sm:ml-3 md:ml-4 w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 group-hover:animate-spin" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto mt-12 sm:mt-16 md:mt-20 px-2">
                <div className="text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">50+</div>
                  <div className="text-gray-400 text-xs sm:text-sm font-medium">Live Events</div>
                </div>

                <div className="text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">25K+</div>
                  <div className="text-gray-400 text-xs sm:text-sm font-medium">Happy Customers</div>
                </div>

                <div className="text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">15</div>
                  <div className="text-gray-400 text-xs sm:text-sm font-medium">Premium Venues</div>
                </div>

                <div className="text-center p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">4.9</div>
                  <div className="text-gray-400 text-xs sm:text-sm font-medium">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
