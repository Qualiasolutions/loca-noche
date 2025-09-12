"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { LogoHeader } from "@/components/logo-header"

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: string
  price: number
  childPrice?: number
  available: number
  description: string
  image: string
  category: string
}

export default function TicketsPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const upcomingEvents = [
    {
      id: "1",
      title: "Lakatamia Hofbräu Oktoberfest - Minus One",
      date: "October 11, 2024",
      time: "17:00 - 00:00",
      venue: "River Park Lakatamia",
      price: 10,
      childPrice: 5,
      available: 300,
      description: "Lakatamia Hofbräu in München Oktoberfest presents Minus One - An authentic German beer festival experience with live music",
      image: "https://i.ibb.co/DDXtKYmG/NICOSIA-Instagram-Post-45-7.png",
      category: "Oktoberfest"
    },
    {
      id: "2",
      title: "Lakatamia Hofbräu Oktoberfest - Giannis Margaris",
      date: "October 12, 2024",
      time: "17:00 - 00:00",
      venue: "River Park Lakatamia",
      price: 10,
      childPrice: 5,
      available: 300,
      description: "Lakatamia Hofbräu in München Oktoberfest presents Giannis Margaris - Traditional Bavarian celebration with live entertainment",
      image: "https://i.ibb.co/S42KhYHF/NICOSIA-Instagram-Post-45-6.png",
      category: "Oktoberfest"
    },
  ]

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const handleEventClick = (eventId: string) => {
    // Redirect to booking page
    window.open('https://locanoche.com', '_blank')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <Image src="/entertainment-bg.jpg" alt="Entertainment background" fill className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-yellow-900/30"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <LogoHeader />
            <Link href="/">
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white bg-transparent transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </nav>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
              OKTOBERFEST 2024
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience authentic Bavarian festivities at Lakatamia Hofbräu in München
            </p>
            <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto mt-6 rounded-full"></div>
          </div>

          {/* Events Carousel */}
          <div className="relative max-w-7xl mx-auto">
            {/* Navigation Buttons */}
            <Button
              variant="outline"
              size="lg"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500 rounded-full w-12 h-12 p-0"
              onClick={scrollLeft}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500 rounded-full w-12 h-12 p-0"
              onClick={scrollRight}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Events Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-6"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {upcomingEvents.map((event, index) => (
                <Card
                  key={event.id}
                  className="min-w-[400px] bg-gray-900/80 border-gray-700 cursor-pointer transition-all duration-500 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-105 group"
                  onClick={() => handleEventClick(event.id)}
                  style={{ 
                    animation: `slideInFromRight 0.6s ease-out ${index * 0.1}s both` 
                  }}
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-4 left-4 bg-red-500/90 text-white backdrop-blur-sm">
                      {event.category}
                    </Badge>
                    
                    {/* Price Badge */}
                    <div className="absolute top-4 right-4 space-y-1">
                      <Badge className="bg-yellow-500 text-black font-bold text-lg block">
                        €{event.price}
                      </Badge>
                      {event.childPrice && (
                        <Badge className="bg-yellow-400 text-black font-semibold text-sm block">
                          Under 12: €{event.childPrice}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-white font-bold text-xl group-hover:text-red-400 transition-colors">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm leading-relaxed">
                      {event.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Calendar className="w-4 h-4 text-red-400" />
                        <span>{event.date}</span>
                        <Clock className="w-4 h-4 text-yellow-400 ml-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="text-sm">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">{event.available} tickets available</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all duration-300 hover:scale-105 group"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event.id)
                      }}
                    >
                      Book Now
                      <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <p className="text-gray-400 mb-6 text-lg">
              Can't find what you're looking for? 
            </p>
            <Link href="https://locanoche.com" target="_blank">
              <Button className="bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-black font-bold">
                Visit: locanoche.com
              </Button>
            </Link>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes slideInFromRight {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
