"use client"

import React from 'react'
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Music, Users, Sparkles, Play, ArrowRight } from "lucide-react"

export default function PremiumHero() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-yellow-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 animate-float">
            <Music className="w-8 h-8 text-red-500/30" />
          </div>
          <div className="absolute top-3/4 left-3/4 animate-float delay-1000">
            <Sparkles className="w-6 h-6 text-yellow-400/40" />
          </div>
          <div className="absolute top-1/2 right-1/4 animate-float delay-500">
            <Calendar className="w-7 h-7 text-purple-400/30" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-lg">LN</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              LOCA NOCHE
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-gray-300 hover:text-white transition-colors">Events</Link>
            <Link href="/venues" className="text-gray-300 hover:text-white transition-colors">Venues</Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
          </div>
          
          <Link href="/tickets">
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/25 transition-all duration-300 hover:shadow-red-500/40 hover:scale-105">
              Get Tickets
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-6xl mx-auto">
          
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <Badge className="bg-gradient-to-r from-red-500/10 to-yellow-500/10 border-red-500/20 text-red-400 px-6 py-2 text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Cyprus's Premier Entertainment Platform
            </Badge>
          </div>

          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-bold mb-6 leading-none">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                LOCA
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 bg-clip-text text-transparent animate-gradient-x">
                NOCHE
              </span>
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto mb-8 rounded-full"></div>
          </div>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light max-w-4xl mx-auto leading-relaxed">
            Experience <span className="text-white font-semibold">unforgettable live concerts</span>, 
            <span className="text-yellow-400 font-semibold"> cultural events</span>, and 
            <span className="text-red-400 font-semibold"> premium entertainment</span> across Cyprus
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            Join thousands of music lovers at Cyprus's most spectacular venues. 
            Book your tickets now for an experience you'll never forget.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/events">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 text-lg font-semibold shadow-2xl shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105 border-0">
                <Calendar className="mr-3 w-5 h-5" />
                Explore Events
              </Button>
            </Link>
            
            <Button size="lg" variant="outline" className="border-2 border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105">
              <Play className="mr-3 w-5 h-5" />
              Watch Trailer
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-400 text-sm font-medium">Live Events</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">25K+</div>
              <div className="text-gray-400 text-sm font-medium">Happy Customers</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">15</div>
              <div className="text-gray-400 text-sm font-medium">Premium Venues</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">4.9</div>
              <div className="text-gray-400 text-sm font-medium">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  )
}

// Add custom animations to globals.css
const customAnimations = `
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes gradient-x {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-gradient-x {
  background-size: 400% 400%;
  animation: gradient-x 3s ease infinite;
}
`