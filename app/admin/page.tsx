"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Settings, Ticket, CheckCircle, AlertCircle, Euro, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [vivaPaymentEnabled, setVivaPaymentEnabled] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [events, setEvents] = useState([
    { id: 1, name: "Summer Music Festival 2025", price: 25, currency: "EUR", active: true, capacity: 500, sold: 120 },
    {
      id: 2,
      name: "Jazz Night at Municipal Theater",
      price: 15,
      currency: "EUR",
      active: false,
      capacity: 200,
      sold: 0,
    },
    { id: 3, name: "Cyprus Rock Concert", price: 35, currency: "EUR", active: true, capacity: 800, sold: 245 },
  ])

  const handleVivaPaymentTest = async () => {
    setConnectionStatus("connecting")
    // Simulate API call
    setTimeout(() => {
      setConnectionStatus("connected")
      setVivaPaymentEnabled(true)
    }, 2000)
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
        <Tabs defaultValue="payment" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
            <TabsTrigger value="payment" className="flex items-center gap-2 font-sans">
              <CreditCard className="w-4 h-4" />
              Viva Payment Setup
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2 font-sans">
              <Ticket className="w-4 h-4" />
              Event Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 font-sans">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Payment Configuration */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="flex items-center gap-2 font-sans">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  Viva Payment Integration
                </CardTitle>
                <CardDescription className="font-serif">
                  Configure Viva Payment to process secure ticket sales for all your events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Enhanced Connection Status */}
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
                          : "Configure your API credentials below to get started"}
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

                {/* Enhanced API Configuration */}
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="merchant-id" className="text-sm font-semibold font-sans">
                      Viva Payment Merchant ID
                    </Label>
                    <Input
                      id="merchant-id"
                      placeholder="Enter your Merchant ID (e.g., 12345678-1234-1234-1234-123456789012)"
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
                  <div className="grid gap-3">
                    <Label htmlFor="source-code" className="text-sm font-semibold font-sans">
                      Source Code
                    </Label>
                    <Input
                      id="source-code"
                      placeholder="Enter your Viva Payment Source Code (4 digits)"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Enhanced Environment Selection */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold font-sans">Payment Environment</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="radio" name="environment" value="demo" defaultChecked className="text-red-600" />
                      <div>
                        <span className="font-medium font-sans">Demo Environment</span>
                        <p className="text-xs text-gray-600 font-serif">For testing and development</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="radio" name="environment" value="production" className="text-red-600" />
                      <div>
                        <span className="font-medium font-sans">Production Environment</span>
                        <p className="text-xs text-gray-600 font-serif">For live payments</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handleVivaPaymentTest}
                    disabled={connectionStatus === "connecting"}
                    className="bg-red-600 hover:bg-red-700 font-sans font-semibold"
                  >
                    {connectionStatus === "connecting" ? "Testing Connection..." : "Test Viva Connection"}
                  </Button>
                  <Button variant="outline" className="font-sans bg-transparent">
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Payment Features */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-sans">Payment Features & Options</CardTitle>
                <CardDescription className="font-serif">
                  Configure available payment methods and customer options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="enable-viva" className="font-semibold font-sans">
                      Enable Viva Payment
                    </Label>
                    <p className="text-sm text-gray-600 font-serif">
                      Allow customers to pay securely with Viva Payment gateway
                    </p>
                  </div>
                  <Switch id="enable-viva" checked={vivaPaymentEnabled} onCheckedChange={setVivaPaymentEnabled} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="enable-installments" className="font-semibold font-sans">
                      Enable Installment Payments
                    </Label>
                    <p className="text-sm text-gray-600 font-serif">Allow customers to pay in multiple installments</p>
                  </div>
                  <Switch id="enable-installments" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="enable-wallet" className="font-semibold font-sans">
                      Enable Viva Wallet
                    </Label>
                    <p className="text-sm text-gray-600 font-serif">Accept payments through Viva Wallet mobile app</p>
                  </div>
                  <Switch id="enable-wallet" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Event Management */}
          <TabsContent value="events" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="font-sans">Event Ticket Management</CardTitle>
                <CardDescription className="font-serif">
                  Manage pricing, availability, and sales for all your events
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 font-sans">{event.name}</h3>
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Euro className="w-4 h-4" />
                              <span className="font-serif">€{event.price} per ticket</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span className="font-serif">
                                {event.sold}/{event.capacity} sold
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(event.sold / event.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-6">
                          <Badge
                            variant={event.active ? "default" : "secondary"}
                            className={`${event.active ? "bg-green-600 hover:bg-green-700" : ""} font-sans`}
                          >
                            {event.active ? "Live Sales" : "Draft"}
                          </Badge>
                          <Button variant="outline" size="sm" className="font-sans bg-transparent">
                            Edit Event
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-6 bg-red-600 hover:bg-red-700 font-sans font-semibold">
                  <Calendar className="w-4 h-4 mr-2" />
                  Create New Event
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Settings */}
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
                    <Input id="company-name" defaultValue="Loca Noche Entertainment" className="font-serif" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="contact-email" className="font-semibold font-sans">
                      Contact Email
                    </Label>
                    <Input id="contact-email" defaultValue="Locanocheuk@hotmail.com" className="font-serif" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="phone" className="font-semibold font-sans">
                      Phone Number
                    </Label>
                    <Input id="phone" defaultValue="99144630" className="font-serif" />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="location" className="font-semibold font-sans">
                      Location
                    </Label>
                    <Input id="location" defaultValue="Nicosia, Cyprus" className="font-serif" />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="address" className="font-semibold font-sans">
                    Business Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter complete business address for invoicing and legal purposes"
                    className="font-serif"
                    rows={3}
                  />
                </div>
                <Button className="bg-red-600 hover:bg-red-700 font-sans font-semibold">Save All Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
