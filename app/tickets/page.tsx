"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, MapPin, Clock, Users, ExternalLink, Euro } from "lucide-react"
import { LogoHeader } from "@/components/logo-header"
import { TicketSelector } from "@/components/booking/TicketSelector"
import { CustomerForm, CustomerData } from "@/components/booking/CustomerForm"

interface TicketType {
  id: string
  name: string
  price: number
  available: number
  description: string
}

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: string
  available: number
  description: string
  image: string
  category: string
  ticketTypes: TicketType[]
}

export default function TicketsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<{
    eventId: string
    eventTitle: string
    ticketSelections: any[]
    total: number
  } | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  // Static fallback events in case API fails
  const upcomingEvents = [
    {
      id: "1",
      title: "Lakatamia Hofbräu Oktoberfest - Minus One",
      date: "October 11, 2024",
      time: "17:00 - 00:00",
      venue: "River Park Lakatamia",
      available: 300,
      description: "Lakatamia Hofbräu in München Oktoberfest presents Minus One - An authentic German beer festival experience with live music",
      image: "https://i.ibb.co/DDXtKYmG/NICOSIA-Instagram-Post-45-7.png",
      category: "Oktoberfest",
      ticketTypes: [
        { id: "adult-1", name: "Adult Ticket", price: 10, available: 250, description: "General admission" },
        { id: "child-1", name: "Child Ticket (Under 12)", price: 5, available: 50, description: "General admission" }
      ]
    },
    {
      id: "2",
      title: "Lakatamia Hofbräu Oktoberfest - Giannis Margaris",
      date: "October 12, 2024",
      time: "17:00 - 00:00",
      venue: "River Park Lakatamia",
      available: 300,
      description: "Lakatamia Hofbräu in München Oktoberfest presents Giannis Margaris - Traditional Bavarian celebration with live entertainment",
      image: "https://i.ibb.co/S42KhYHF/NICOSIA-Instagram-Post-45-6.png",
      category: "Oktoberfest",
      ticketTypes: [
        { id: "adult-2", name: "Adult Ticket", price: 10, available: 250, description: "General admission" },
        { id: "child-2", name: "Child Ticket (Under 12)", price: 5, available: 50, description: "General admission" }
      ]
    },
  ]

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?category=FESTIVAL&status=PUBLISHED')
      if (response.ok) {
        const data = await response.json()
        const formattedEvents: Event[] = data.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: new Date(event.eventDate).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          time: `${new Date(event.startTime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })} - ${new Date(event.endTime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          venue: event.venue.name,
          available: event.capacity - (event._count?.bookings || 0),
          description: event.description,
          image: Array.isArray(event.images) ? event.images[0] : event.images,
          category: event.category,
          ticketTypes: event.ticketTypes.map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: Number(tt.price),
            available: tt.quantity - tt.sold,
            description: tt.description
          }))
        }))
        setEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTicketSelection = async (eventId: string, ticketSelections: any[], total: number) => {
    // Store the selection and show customer form
    const event = displayEvents.find(e => e.id === eventId)
    setSelectedPurchase({
      eventId,
      eventTitle: event?.title || 'Event',
      ticketSelections,
      total
    })
    setShowCustomerForm(true)
  }

  const handleCustomerSubmit = async (customerData: CustomerData) => {
    if (!selectedPurchase) return

    setIsProcessingPayment(true)
    try {
      const response = await fetch('/api/payments/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedPurchase.eventId,
          ticketSelections: selectedPurchase.ticketSelections,
          total: selectedPurchase.total,
          preCalculated: true,
          description: `${selectedPurchase.eventTitle} - Total: €${selectedPurchase.total}`,
          customerData
        })
      })

      const paymentResponse = await response.json()

      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Calculate ticket breakdown
        const adultTickets = selectedPurchase.ticketSelections
          .filter(t => t.ticketTypeName === 'adult')
          .reduce((sum, t) => sum + t.quantity, 0)

        const childTickets = selectedPurchase.ticketSelections
          .filter(t => t.ticketTypeName === 'child')
          .reduce((sum, t) => sum + t.quantity, 0)

        const totalQuantity = adultTickets + childTickets
        const customerName = `${customerData.firstName} ${customerData.lastName}`

        // Redirect to VivaPayments in same tab
        window.location.href = paymentResponse.paymentUrl
      } else {
        alert(`Payment creation failed: ${paymentResponse.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Unable to create payment. Please try again.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleCustomerCancel = () => {
    setShowCustomerForm(false)
    setSelectedPurchase(null)
  }

  // Use fetched events or fallback to static data
  const displayEvents = events.length > 0 ? events : upcomingEvents

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
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="text-center mb-8 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
              OKTOBERFEST 2024
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-2">
              Experience authentic Bavarian festivities at Lakatamia Hofbräu in München
            </p>
            <div className="h-1 w-24 md:w-32 bg-gradient-to-r from-red-500 to-yellow-400 mx-auto mt-4 md:mt-6 rounded-full"></div>
          </div>

          {/* Events Grid */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 justify-center">
              {displayEvents.map((event, index) => (
                <Card
                  key={event.id}
                  className="bg-gray-900/80 border-gray-700 transition-all duration-500 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-[1.02] group overflow-hidden"
                  style={{ 
                    animation: `slideInFromRight 0.6s ease-out ${index * 0.2}s both` 
                  }}
                >
                  {/* Event Image */}
                  <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-gray-800">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category Badge */}
                    <Badge className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-500/90 text-white backdrop-blur-sm text-xs sm:text-sm">
                      {event.category}
                    </Badge>
                  </div>

                  <CardHeader className="pb-3 px-3 sm:px-6 sm:pb-4">
                    <CardTitle className="text-white font-bold text-lg sm:text-xl group-hover:text-red-400 transition-colors">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm leading-relaxed">
                      {event.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 px-3 sm:px-6 sm:space-y-4">
                    {/* Event Details */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0" />
                        <span className="text-sm sm:text-base">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
                        <span className="text-sm sm:text-base">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0" />
                        <span className="text-sm">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
                        <span className="text-sm">{event.available} tickets available</span>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    {/* Ticket Selector or Customer Form */}
                    {showCustomerForm && selectedPurchase?.eventId === event.id ? (
                      <CustomerForm
                        eventTitle={selectedPurchase.eventTitle}
                        totalTickets={selectedPurchase.ticketSelections.reduce((sum: number, sel: any) => sum + sel.quantity, 0)}
                        totalAmount={selectedPurchase.total}
                        onSubmit={handleCustomerSubmit}
                        onCancel={handleCustomerCancel}
                        isLoading={isProcessingPayment}
                      />
                    ) : (
                      <TicketSelector
                        eventId={event.id}
                        eventTitle={event.title}
                        ticketTypes={event.ticketTypes}
                        onPurchase={handleTicketSelection}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-8 md:mt-16 px-4">
            <p className="text-gray-400 mb-4 md:mb-6 text-base md:text-lg">
              Ready to experience the authentic Bavarian celebration? 
            </p>
            <Link href="https://locanoche.com" target="_blank">
              <Button className="bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 text-black font-bold text-base md:text-lg px-6 md:px-8 py-3 h-12 md:h-auto">
                Visit locanoche.com
                <ExternalLink className="ml-2 w-4 h-4" />
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
