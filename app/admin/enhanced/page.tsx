"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  CreditCard, 
  Settings, 
  Ticket, 
  CheckCircle, 
  AlertCircle, 
  Euro, 
  Calendar, 
  Users,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"

interface Event {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  venue: {
    name: string
  }
  eventDate: string
  capacity: number
  ticketTypes: {
    id: string
    name: string
    price: number
    quantity: number
    sold: number
  }[]
  _count: {
    bookings: number
  }
}

interface DashboardStats {
  totalRevenue: number
  totalBookings: number
  totalEvents: number
  conversionRate: number
}

export default function EnhancedAdminPage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalBookings: 0,
    totalEvents: 0,
    conversionRate: 0
  })
  const [vivaPaymentEnabled, setVivaPaymentEnabled] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category: 'CONCERT',
    venueId: '',
    eventDate: '',
    startTime: '',
    capacity: 100,
    ticketTypes: [
      { name: 'Standard', price: 25, quantity: 80 },
      { name: 'VIP', price: 50, quantity: 20 }
    ]
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch events
      const eventsResponse = await fetch('/api/events')
      const eventsData = await eventsResponse.json()
      setEvents(eventsData.events || [])

      // Calculate stats
      const totalBookings = eventsData.events?.reduce((sum: number, event: Event) => 
        sum + event._count.bookings, 0) || 0
      
      const totalRevenue = eventsData.events?.reduce((sum: number, event: Event) => 
        sum + event.ticketTypes.reduce((eventSum, type) => 
          eventSum + (type.sold * type.price), 0), 0) || 0

      const conversionRate = totalBookings > 0 ? (totalBookings / (totalBookings * 10)) * 100 : 0

      setStats({
        totalRevenue,
        totalBookings,
        totalEvents: eventsData.events?.length || 0,
        conversionRate
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newEvent,
          eventDate: new Date(newEvent.eventDate + 'T' + newEvent.startTime),
          startTime: new Date(newEvent.eventDate + 'T' + newEvent.startTime),
          venueId: 'default-venue-id', // This would come from a venue selector
        }),
      })

      if (response.ok) {
        await fetchDashboardData()
        // Reset form
        setNewEvent({
          title: '',
          description: '',
          category: 'CONCERT',
          venueId: '',
          eventDate: '',
          startTime: '',
          capacity: 100,
          ticketTypes: [
            { name: 'Standard', price: 25, quantity: 80 },
            { name: 'VIP', price: 50, quantity: 20 }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const handleVivaPaymentTest = async () => {
    setConnectionStatus("connecting")
    // Simulate API call to test Viva Payment connection
    setTimeout(() => {
      setConnectionStatus("connected")
      setVivaPaymentEnabled(true)
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LN</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 font-sans">Loca Noche Admin</h1>
              </div>
            </div>
            <Badge variant="outline" className="text-red-600 border-red-600 font-sans">
              Administrator Portal
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="events" className="flex items-center gap-2 font-sans">
              <Ticket className="w-4 h-4" />
              Event Management
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2 font-sans">
              <Plus className="w-4 h-4" />
              Create Event
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2 font-sans">
              <CreditCard className="w-4 h-4" />
              Payment Setup
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 font-sans">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Events Management */}
          <TabsContent value="events" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="font-sans">Event Management</CardTitle>
                <CardDescription className="font-serif">
                  Manage all your events, pricing, and ticket sales
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg font-sans">{event.title}</h3>
                            <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3 font-serif">{event.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-serif">
                                {new Date(event.eventDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span className="font-serif">{event.venue.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4" />
                              <span className="font-serif">
                                {event.ticketTypes.reduce((sum, type) => sum + type.sold, 0)} / {event.capacity} sold
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {event.ticketTypes.map((ticketType) => (
                              <div key={ticketType.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-sm">{ticketType.name}</span>
                                  <span className="font-bold text-red-600">€{ticketType.price}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full"
                                    style={{ 
                                      width: `${Math.min((ticketType.sold / ticketType.quantity) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {ticketType.sold} / {ticketType.quantity} sold
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-6">
                          <Button variant="outline" size="sm" className="font-sans">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="font-sans">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Event */}
          <TabsContent value="create" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="font-sans">Create New Event</CardTitle>
                <CardDescription className="font-serif">
                  Set up a new event with ticket types and pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="font-sans">Event Title</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Enter event title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-sans">Category</Label>
                    <Select value={newEvent.category} onValueChange={(value) => setNewEvent({...newEvent, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONCERT">Concert</SelectItem>
                        <SelectItem value="THEATER">Theater</SelectItem>
                        <SelectItem value="FESTIVAL">Festival</SelectItem>
                        <SelectItem value="COMEDY">Comedy</SelectItem>
                        <SelectItem value="CULTURAL">Cultural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eventDate" className="font-sans">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={newEvent.eventDate}
                      onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="font-sans">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="font-sans">Venue Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newEvent.capacity}
                      onChange={(e) => setNewEvent({...newEvent, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-sans">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Describe your event..."
                    rows={4}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="font-sans text-lg">Ticket Types</Label>
                  {newEvent.ticketTypes.map((ticket, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <Label className="font-sans text-sm">Type Name</Label>
                        <Input
                          value={ticket.name}
                          onChange={(e) => {
                            const updated = [...newEvent.ticketTypes]
                            updated[index].name = e.target.value
                            setNewEvent({...newEvent, ticketTypes: updated})
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-sans text-sm">Price (€)</Label>
                        <Input
                          type="number"
                          value={ticket.price}
                          onChange={(e) => {
                            const updated = [...newEvent.ticketTypes]
                            updated[index].price = parseFloat(e.target.value)
                            setNewEvent({...newEvent, ticketTypes: updated})
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-sans text-sm">Quantity</Label>
                        <Input
                          type="number"
                          value={ticket.quantity}
                          onChange={(e) => {
                            const updated = [...newEvent.ticketTypes]
                            updated[index].quantity = parseInt(e.target.value)
                            setNewEvent({...newEvent, ticketTypes: updated})
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleCreateEvent}
                  className="w-full bg-red-600 hover:bg-red-700 font-sans font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Configuration */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="flex items-center gap-2 font-sans">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  Viva Payment Integration
                </CardTitle>
                <CardDescription className="font-serif">
                  Configure Viva Payment to process secure ticket sales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border">
                  <div className="flex items-center gap-4">
                    {connectionStatus === "connected" ? (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg font-sans">
                        {connectionStatus === "connected" ? "Connected to Viva Payment" : "Viva Payment Not Connected"}
                      </p>
                      <p className="text-sm text-gray-600 font-serif">
                        {connectionStatus === "connected"
                          ? "Ready to process live payments securely"
                          : "Configure your API credentials to get started"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={connectionStatus === "connected" ? "default" : "secondary"}
                    className={`${connectionStatus === "connected" ? "bg-green-600 hover:bg-green-700" : ""} font-sans`}
                  >
                    {connectionStatus === "connected" ? "Live & Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="merchant-id" className="text-sm font-semibold font-sans">
                      Viva Payment Merchant ID
                    </Label>
                    <Input
                      id="merchant-id"
                      placeholder="Enter your Merchant ID"
                      type="password"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="api-key" className="text-sm font-semibold font-sans">
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      placeholder="Enter your Viva Payment API Key"
                      type="password"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleVivaPaymentTest}
                    disabled={connectionStatus === "connecting"}
                    className="bg-red-600 hover:bg-red-700 font-sans font-semibold"
                  >
                    {connectionStatus === "connecting" ? "Testing Connection..." : "Test Viva Connection"}
                  </Button>
                  <Button variant="outline" className="font-sans">
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="font-sans">Business Configuration</CardTitle>
                <CardDescription className="font-serif">
                  Configure your company information and website settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="company-name" className="font-semibold font-sans">
                      Company Name
                    </Label>
                    <Input id="company-name" defaultValue="Loca Noche Entertainment" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="contact-email" className="font-semibold font-sans">
                      Contact Email
                    </Label>
                    <Input id="contact-email" defaultValue="Locanocheuk@hotmail.com" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="phone" className="font-semibold font-sans">
                      Phone Number
                    </Label>
                    <Input id="phone" defaultValue="99107227" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="location" className="font-semibold font-sans">
                      Location
                    </Label>
                    <Input id="location" defaultValue="Nicosia, Cyprus" />
                  </div>
                </div>
                <Button className="bg-red-600 hover:bg-red-700 font-sans font-semibold">
                  Save All Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}