"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, CreditCard } from "lucide-react"

interface CustomerFormProps {
  eventTitle: string
  totalTickets: number
  totalAmount: number
  onSubmit: (customerData: CustomerData) => void
  isLoading?: boolean
  onCancel: () => void
}

export interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export function CustomerForm({
  eventTitle,
  totalTickets,
  totalAmount,
  onSubmit,
  isLoading = false,
  onCancel
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  const [errors, setErrors] = useState<Partial<CustomerData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof CustomerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="bg-gray-900/80 border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-white flex items-center justify-center space-x-3">
          <User className="w-6 h-6 text-green-400" />
          <span>Customer Information</span>
        </CardTitle>
        <div className="text-center text-gray-300 space-y-2">
          <p className="text-lg font-medium">{eventTitle}</p>
          <div className="flex justify-center space-x-6 text-sm">
            <span>{totalTickets} ticket{totalTickets !== 1 ? 's' : ''}</span>
            <span className="text-green-400 font-bold">€{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-red-400 text-sm">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-300">
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-red-400 text-sm">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Email Address *</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email address"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email}</p>
            )}
            <p className="text-gray-400 text-xs">
              Your tickets will be sent to this email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300 flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Phone Number *</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-red-400 text-sm">{errors.phone}</p>
            )}
          </div>

          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Important Information:</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Your tickets will be emailed to you with QR codes</li>
              <li>• Present your QR codes at the venue entrance</li>
              <li>• Keep your email safe - it's your ticket!</li>
              <li>• Tickets are non-refundable</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              Back to Tickets
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}