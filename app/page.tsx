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
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <LogoHeader />
            
            
            {/* Contact info */}
            <div className="hidden lg:block text-sm text-gray-400">
              <span className="text-yellow-400 font-bold">99144630</span>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center max-w-4xl mx-auto">
              
              {/* Brand Statement */}
              <div className="mb-12">
                <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-none">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    PREMIUM
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent animate-gradient-x">
                    ENTERTAINMENT
                  </span>
                </h1>
                <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto mb-8 rounded-full"></div>
              </div>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light max-w-3xl mx-auto leading-relaxed">
                Experience <span className="text-white font-semibold">unforgettable live concerts</span> and 
                <span className="text-yellow-400 font-semibold"> cultural events</span> across Cyprus
              </p>
              
              <p className="text-lg text-gray-400 mb-16 max-w-2xl mx-auto">
                Cyprus's premier entertainment platform bringing you the best live experiences
              </p>

              {/* Main CTA Button */}
              <div className="relative inline-block">
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-yellow-400 blur-lg opacity-60 rounded-2xl scale-110"></div>
                
                <Link href="/tickets">
                  <Button 
                    size="lg" 
                    className="relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-6 text-2xl font-bold shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 border-0 rounded-2xl group"
                  >
                    <Ticket className="mr-4 w-8 h-8 group-hover:rotate-12 transition-transform" />
                    TICKETS
                    <Sparkles className="ml-4 w-6 h-6 group-hover:animate-spin" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mt-20">
                <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-2">50+</div>
                  <div className="text-gray-400 text-sm font-medium">Live Events</div>
                </div>

                <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-2">25K+</div>
                  <div className="text-gray-400 text-sm font-medium">Happy Customers</div>
                </div>

                <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-2">15</div>
                  <div className="text-gray-400 text-sm font-medium">Premium Venues</div>
                </div>

                <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="text-3xl font-bold text-white mb-2">4.9</div>
                  <div className="text-gray-400 text-sm font-medium">Rating</div>
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
