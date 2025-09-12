"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Euro, 
  Minus, 
  Plus,
  CreditCard,
  Loader2
} from 'lucide-react'

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional(),
  adultTickets: z.number().min(0).max(8, 'Maximum 8 adult tickets'),
  childTickets: z.number().min(0).max(8, 'Maximum 8 child tickets'),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: string
  image: string
  ticketTypes: {
    id: string
    name: string
    price: number
    available: number
    description: string
  }[]
}

interface BookingModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export function BookingModal({ event, isOpen, onClose }: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [adultTickets, setAdultTickets] = useState(0)
  const [childTickets, setChildTickets] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const handleClose = () => {
    reset()
    setAdultTickets(0)
    setChildTickets(0)
    onClose()
  }

  const adultTicketType = event?.ticketTypes.find(t => t.name.includes('Adult'))
  const childTicketType = event?.ticketTypes.find(t => t.name.includes('Child'))

  const adultPrice = adultTicketType?.price || 10
  const childPrice = childTicketType?.price || 5

  const subtotal = (adultTickets * adultPrice) + (childTickets * childPrice)
  const serviceFee = subtotal * 0.03 // 3% service fee
  const tax = (subtotal + serviceFee) * 0.19 // 19% VAT
  const total = subtotal + serviceFee + tax

  const adjustQuantity = (type: 'adult' | 'child', delta: number) => {
    if (type === 'adult') {
      const newValue = Math.max(0, Math.min(8, adultTickets + delta))
      setAdultTickets(newValue)
      setValue('adultTickets', newValue)
    } else {
      const newValue = Math.max(0, Math.min(8, childTickets + delta))
      setChildTickets(newValue)
      setValue('childTickets', newValue)
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!event) return
    if (adultTickets === 0 && childTickets === 0) {
      alert('Please select at least one ticket')
      return
    }

    setIsLoading(true)

    try {
      // Create bookings for each ticket type
      const bookings = []

      if (adultTickets > 0 && adultTicketType) {
        const adultBookingResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTypeId: adultTicketType.id,
            quantity: adultTickets,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            notes: data.notes,
          }),
        })

        if (!adultBookingResponse.ok) {
          throw new Error('Failed to create adult booking')
        }

        const adultBooking = await adultBookingResponse.json()
        bookings.push(adultBooking)
      }

      if (childTickets > 0 && childTicketType) {
        const childBookingResponse = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            ticketTypeId: childTicketType.id,
            quantity: childTickets,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            notes: data.notes,
          }),
        })

        if (!childBookingResponse.ok) {
          throw new Error('Failed to create child booking')
        }

        const childBooking = await childBookingResponse.json()
        bookings.push(childBooking)
      }

      // Use the first booking to create payment
      const primaryBooking = bookings[0]
      
      // Create payment
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: primaryBooking.id,
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment')
      }

      const payment = await paymentResponse.json()

      // Redirect to payment
      window.open(payment.paymentUrl, '_blank')
      handleClose()
      
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-red-400">
            Book Tickets
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm sm:text-base">
            {event.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Event Details */}
          <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gray-800/50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0" />
                <span className="text-sm sm:text-base">{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
                <span className="text-sm sm:text-base">{event.time}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-gray-300">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 shrink-0" />
              <span className="text-sm sm:text-base">{event.venue}</span>
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-sm sm:text-base">Select Tickets</span>
            </h4>

            {/* Adult Tickets */}
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Adult Ticket</p>
                <p className="text-xs sm:text-sm text-gray-400">General admission</p>
                <Badge className="bg-yellow-500 text-black font-bold text-xs sm:text-sm">
                  €{adultPrice}
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity('adult', -1)}
                  disabled={adultTickets === 0}
                  className="border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{adultTickets}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity('adult', 1)}
                  disabled={adultTickets >= 8}
                  className="border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            {/* Child Tickets */}
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Child Ticket (Under 12)</p>
                <p className="text-xs sm:text-sm text-gray-400">General admission</p>
                <Badge className="bg-yellow-400 text-black font-bold text-xs sm:text-sm">
                  €{childPrice}
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity('child', -1)}
                  disabled={childTickets === 0}
                  className="border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{childTickets}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustQuantity('child', 1)}
                  disabled={childTickets >= 8}
                  className="border-gray-600 text-white hover:bg-gray-700 h-8 w-8 p-0 sm:h-9 sm:w-9"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>

          {(adultTickets > 0 || childTickets > 0) && (
            <>
              <Separator className="bg-gray-700" />

              {/* Customer Information Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-white text-sm sm:text-base">Customer Information</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-xs sm:text-sm">Full Name *</Label>
                    <Input
                      id="customerName"
                      {...register('customerName')}
                      className="bg-gray-800 border-gray-600 text-white h-10 sm:h-11 text-sm sm:text-base"
                      placeholder="Enter your full name"
                    />
                    {errors.customerName && (
                      <p className="text-red-400 text-xs sm:text-sm">{errors.customerName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-xs sm:text-sm">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...register('customerEmail')}
                      className="bg-gray-800 border-gray-600 text-white h-10 sm:h-11 text-sm sm:text-base"
                      placeholder="Enter your email"
                    />
                    {errors.customerEmail && (
                      <p className="text-red-400 text-xs sm:text-sm">{errors.customerEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-xs sm:text-sm">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    {...register('customerPhone')}
                    className="bg-gray-800 border-gray-600 text-white h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="Enter your phone number (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs sm:text-sm">Special Requests</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    className="bg-gray-800 border-gray-600 text-white text-sm sm:text-base"
                    placeholder="Any special requests or notes (optional)"
                    rows={3}
                  />
                </div>

                <Separator className="bg-gray-700" />

                {/* Price Summary */}
                <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Euro className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                    <span className="text-sm sm:text-base">Order Summary</span>
                  </h4>
                  
                  {adultTickets > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        Adult tickets × {adultTickets}
                      </span>
                      <span className="text-white">€{(adultTickets * adultPrice).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {childTickets > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        Child tickets × {childTickets}
                      </span>
                      <span className="text-white">€{(childTickets * childPrice).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">€{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Service Fee (3%)</span>
                    <span className="text-white">€{serviceFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">VAT (19%)</span>
                    <span className="text-white">€{tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator className="bg-gray-600" />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-white">Total</span>
                    <span className="text-yellow-400">€{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-700 h-12 text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold h-12 text-sm sm:text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="text-xs sm:text-base">Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-sm sm:text-base">Pay €{total.toFixed(2)}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}