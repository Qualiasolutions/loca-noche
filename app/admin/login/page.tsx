"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminLoginPage() {
  const [accessCode, setAccessCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simple authentication check
    if (accessCode === "the9thchakra") {
      // Set authentication in localStorage
      localStorage.setItem("admin_authenticated", "true")
      localStorage.setItem("admin_login_time", new Date().toISOString())

      // Redirect to admin dashboard
      router.push("/admin/dashboard")
    } else {
      setError("Invalid access code. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="https://www.locanoche.com/logo.png"
              alt="LocaNoche Logo"
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-600">LocaNoche Event Management</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Access Code</CardTitle>
            <CardDescription>
              Please enter your admin access code to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCode ? "text" : "password"}
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Access Admin Panel"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </Link>
        </div>

        {/* Attribution */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Powered by Qualia Solutions
        </div>
      </div>
    </div>
  )
}