"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, ExternalLink, Euro, Loader2 } from "lucide-react"

interface TicketType {
  id: string
  name: string
  price: number
  available: number
  description: string
}

interface TicketSelectorProps {
  eventId: string
  eventTitle: string
  ticketTypes: TicketType[]
  onPurchase?: (eventId: string, ticketType: string, quantity: number, total: number) => void
}

interface TicketSelection {
  [ticketTypeId: string]: number
}

export function TicketSelector({ eventId, eventTitle, ticketTypes, onPurchase }: TicketSelectorProps) {
  const [selections, setSelections] = useState<TicketSelection>({})
  const [isLoading, setIsLoading] = useState(false)

  const updateQuantity = (ticketTypeId: string, change: number) => {
    setSelections(prev => {
      const current = prev[ticketTypeId] || 0
      const newQuantity = Math.max(0, Math.min(20, current + change))

      if (newQuantity === 0) {
        const { [ticketTypeId]: removed, ...rest } = prev
        return rest
      }

      return { ...prev, [ticketTypeId]: newQuantity }
    })
  }

  const getTotalQuantity = () => {
    return Object.values(selections).reduce((sum, qty) => sum + qty, 0)
  }

  const getTotalPrice = () => {
    return Object.entries(selections).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId)
      return total + (ticketType ? ticketType.price * quantity : 0)
    }, 0)
  }

  const handlePurchase = async () => {
    if (getTotalQuantity() === 0) return

    setIsLoading(true)
    try {
      // For now, we'll handle the first selected ticket type
      // In a more complex scenario, you might need to handle multiple ticket types
      const firstSelection = Object.entries(selections)[0]
      if (firstSelection) {
        const [ticketTypeId, quantity] = firstSelection
        const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId)
        if (ticketType && onPurchase) {
          const ticketTypeName = ticketType.name.toLowerCase().includes('child') ? 'child' : 'adult'
          await onPurchase(eventId, ticketTypeName, quantity, getTotalPrice())
        }
      }
    } catch (error) {
      console.error('Purchase error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasSelections = getTotalQuantity() > 0

  return (
    <Card className="bg-gray-900/80 border-gray-700">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <Euro className="w-4 h-4 text-yellow-400" />
            Select Tickets
          </h4>

          {ticketTypes.map((ticketType) => {
            const quantity = selections[ticketType.id] || 0
            const subtotal = ticketType.price * quantity

            return (
              <div key={ticketType.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-300 text-sm font-medium">
                      {ticketType.name.replace(' Ticket', '').replace(' (Under 12)', '')}
                    </span>
                    <Badge className="ml-2 bg-yellow-500 text-black font-bold text-xs">
                      €{ticketType.price}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => updateQuantity(ticketType.id, -1)}
                      disabled={quantity === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-white font-medium">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={() => updateQuantity(ticketType.id, 1)}
                      disabled={quantity >= 20}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {quantity > 0 && (
                  <div className="text-right">
                    <span className="text-sm text-gray-400">
                      Subtotal: <span className="text-white font-medium">€{subtotal}</span>
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hasSelections && (
          <>
            <Separator className="bg-gray-700" />
            <div className="flex justify-between items-center font-semibold">
              <span className="text-white">Total ({getTotalQuantity()} tickets):</span>
              <span className="text-yellow-400 text-lg">€{getTotalPrice()}</span>
            </div>
          </>
        )}

        <Button
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold transition-all duration-300 hover:scale-105 group h-12"
          onClick={handlePurchase}
          disabled={!hasSelections || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Payment...
            </>
          ) : (
            <>
              {hasSelections ? `Buy ${getTotalQuantity()} Ticket${getTotalQuantity() > 1 ? 's' : ''} - €${getTotalPrice()}` : 'Select Tickets'}
              {hasSelections && <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}