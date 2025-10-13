"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Users,
  Activity,
  Settings,
  Download,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  LogOut,
  User,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  BarChart3,
  PieChart,
  FileText,
  Building2,
  Globe,
  Shield,
  Smartphone,
  Mail,
  Phone,
  Star,
  Timer,
  Sparkles,
  Loader2,
  Plus,
  Ticket,
  ArrowRightRight
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AdminStats {
  totalRevenue: number
  totalBookings: number
  totalCustomers: number
  paymentSuccessRate: number
  successfulPayments: number
  failedPayments: number
  recentBookings: Array<{
    id: string
    customerName: string
    eventName: string
    tickets: string
    amount: number
    status: string
    createdAt: string
  }>
}

interface Payment {
  id: string
  orderCode: string
  date: string
  customerName: string
  amount: number
  method: string
  status: string
  event: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalBookings: number
  totalSpent: number
  lastEvent: string
  memberSince: string
}

interface N8nStatus {
  workflows: Array<{
    name: string
    webhookUrl: string
    status: string
    lastExecution: string
    totalExecutions: number
  }>
  services: Array<{
    name: string
    status: string
    description: string
  }>
  recentExecutions: Array<{
    workflow: string
    trigger: string
    status: string
    executionTime: number
    orderCode: string
    customerEmail: string
    timestamp: string
  }>
}

interface PaymentAnalytics {
  summary: {
    totalRevenue: number
    successfulPayments: number
    failedPayments: number
    pendingPayments: number
    refundedPayments: number
    totalTransactions: number
    averageTransactionValue: number
    paymentSuccessRate: number
    conversionRate: number
  }
  breakdown: {
    byStatus: Array<{
      status: string
      count: number
      totalAmount: number
    }>
    byMethod: Array<{
      method: string
      count: number
      totalAmount: number
    }>
  }
  recentPayments: Array<{
    id: string
    orderCode: string
    date: string
    customerName: string
    customerEmail: string
    amount: number
    method: string
    status: string
    event: string
    eventDate: string | null
    processedAt: string | null
  }>
  trends: Array<{
    date: string
    totalTransactions: number
    successfulTransactions: number
    dailyRevenue: number
    successRate: number
  }>
  metrics: {
    totalBookings: number
    bookingToPaymentConversion: number
    paymentFailureRate: number
    refundRate: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null)
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [paymentTimeframe, setPaymentTimeframe] = useState('all')

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("admin_authenticated")
    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [router, paymentTimeframe])

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated")
    localStorage.removeItem("admin_login_time")
    router.push("/admin/login")
  }

  const fetchData = async () => {
    try {
      const [statsRes, paymentsRes, customersRes, n8nRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/customers'),
        fetch('/api/admin/n8n-status'),
        fetch(`/api/admin/payment-analytics?timeframe=${paymentTimeframe}`)
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPayments(paymentsData.payments)
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.customers)
      }

      if (n8nRes.ok) {
        const n8nData = await n8nRes.json()
        setN8nStatus(n8nData)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setPaymentAnalytics(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: "default",
      PENDING: "secondary",
      FAILED: "destructive",
      ACTIVE: "default",
      SUCCESS: "default",
      CONFIRMED: "default"
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const MetricCard = ({ title, value, icon: Icon, description, trend, color = "blue" }: {
    title: string
    value: string | number
    icon: any
    description?: string
    trend?: {
      value: number
      isPositive: boolean
    }
    color?: string
  }) => (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color === 'green' ? 'from-green-400 to-emerald-600' : color === 'blue' ? 'from-blue-400 to-indigo-600' : color === 'purple' ? 'from-purple-400 to-pink-600' : 'from-orange-400 to-red-600'} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color === 'green' ? 'bg-green-100' : color === 'blue' ? 'bg-blue-100' : color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'}`}>
            <Icon className={`h-5 w-5 ${color === 'green' ? 'text-green-600' : color === 'blue' ? 'text-blue-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardHeader>
      {(description || trend) && (
        <CardContent className="pt-0">
          {trend && (
            <div className="flex items-center text-sm">
              {trend.isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={trend.isPositive ? "text-green-500" : "text-red-500"}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </CardContent>
      )}
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
        {/* Enhanced Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Site
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src="https://www.locanoche.com/logo.png"
                      alt="LocaNoche Logo"
                      className="h-10 w-auto drop-shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      LocaNoche Admin
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </h1>
                    <p className="text-sm text-blue-600 font-medium flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Welcome back, Tasos!
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
                  <Timer className="w-4 h-4" />
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="hover:bg-gray-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-gray-50">
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">T</AvatarFallback>
                      </Avatar>
                      Tasos
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Navigation */}
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-gray-50/50 p-1 rounded-xl">
                <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden sm:inline">Payments</span>
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Customers</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Events</span>
                </TabsTrigger>
                <TabsTrigger value="n8n" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg transition-all duration-200">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">N8N</span>
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Content */}
              <TabsContent value="dashboard" className="mt-6 space-y-6">
                {/* Enhanced Payment Analytics */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <DollarSign className="h-8 w-8" />
                        Payment Analytics
                      </h2>
                      <p className="text-blue-100">Real-time insights into your revenue and payment performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={paymentTimeframe} onValueChange={setPaymentTimeframe}>
                        <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <CheckCircle2 className="h-6 w-6 text-green-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{paymentAnalytics?.summary.successfulPayments || 0}</p>
                          <p className="text-sm text-green-100">Completed</p>
                        </div>
                      </div>
                      <div className="text-sm text-white/80">Successful Payments</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <XCircle className="h-6 w-6 text-red-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{paymentAnalytics?.summary.failedPayments || 0}</p>
                          <p className="text-sm text-red-100">Failed</p>
                        </div>
                      </div>
                      <div className="text-sm text-white/80">Failed Payments</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Target className="h-6 w-6 text-yellow-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{paymentAnalytics?.summary.paymentSuccessRate.toFixed(1) || 0}%</p>
                          <p className="text-sm text-yellow-100">Success</p>
                        </div>
                      </div>
                      <div className="text-sm text-white/80">Payment Success Rate</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-purple-300" />
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold">{paymentAnalytics?.metrics.bookingToPaymentConversion.toFixed(1) || 0}%</p>
                          <p className="text-sm text-purple-100">Conversion</p>
                        </div>
                      </div>
                      <div className="text-sm text-white/80">Booking to Payment</div>
                    </div>
                  </div>

                  {/* Real Revenue Highlight */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="text-lg font-medium text-white/90 mb-2">Actual Revenue from Completed Payments</p>
                        <p className="text-4xl font-bold text-white">
                          {formatCurrency(paymentAnalytics?.summary.totalRevenue || 0)}
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                          From {paymentAnalytics?.summary.successfulPayments || 0} successful transactions
                        </p>
                      </div>
                      <div className="text-center lg:text-right">
                        <p className="text-lg font-medium text-white/90 mb-2">Average Transaction</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(paymentAnalytics?.summary.averageTransactionValue || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Bookings"
                    value={stats?.totalBookings || 0}
                    icon={Calendar}
                    description="All time bookings"
                    trend={{ value: 12, isPositive: true }}
                    color="blue"
                  />
                  <MetricCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    icon={Users}
                    description="Unique customers"
                    trend={{ value: 8, isPositive: true }}
                    color="purple"
                  />
                  <MetricCard
                    title="Pending Payments"
                    value={paymentAnalytics?.summary.pendingPayments || 0}
                    icon={Clock}
                    description="Awaiting completion"
                    color="yellow"
                  />
                  <MetricCard
                    title="Refunded"
                    value={paymentAnalytics?.summary.refundedPayments || 0}
                    icon={RefreshCw}
                    description="Processed refunds"
                    color="orange"
                  />
                </div>

                {/* Recent Completed Payments */}
                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">Recent Completed Payments</CardTitle>
                          <CardDescription className="text-gray-600">
                            Latest successful payment transactions from real paying customers
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('payments')} className="hover:bg-green-50">
                        View All Payments
                        <ArrowRightRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {paymentAnalytics?.recentPayments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No completed payments yet</h3>
                        <p className="text-gray-500">No customers have successfully completed payment in the selected timeframe.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="font-semibold text-gray-900">Order Code</TableHead>
                              <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                              <TableHead className="font-semibold text-gray-900">Event</TableHead>
                              <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                              <TableHead className="font-semibold text-gray-900">Method</TableHead>
                              <TableHead className="font-semibold text-gray-900">Completed</TableHead>
                              <TableHead className="font-semibold text-gray-900">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentAnalytics?.recentPayments.map((payment) => (
                              <TableRow key={payment.id} className="hover:bg-green-50/50 transition-colors border-b border-gray-100">
                                <TableCell className="font-mono text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    {payment.orderCode}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-gray-900">{payment.customerName}</div>
                                    <div className="text-sm text-gray-500">{payment.customerEmail}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{payment.event}</TableCell>
                                <TableCell className="font-bold text-green-600">
                                  {formatCurrency(payment.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-gray-100">
                                    {payment.method}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {payment.processedAt
                                    ? formatDate(payment.processedAt)
                                    : formatDate(payment.date)
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bookings Content */}
              <TabsContent value="bookings" className="mt-6 space-y-6">
                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">All Bookings</CardTitle>
                          <CardDescription className="text-gray-600">
                            Manage and monitor all ticket bookings
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search bookings..."
                            className="border-0 focus:ring-0 w-full sm:w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" className="bg-white hover:bg-gray-50">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Booking
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Data Loading...</h3>
                      <p className="text-gray-500 mb-4">Connecting to booking database to display real data.</p>
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Content */}
              <TabsContent value="payments" className="mt-6 space-y-6">
                {/* Payment Analytics Header */}
                <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    <div>
                      <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <CreditCard className="h-8 w-8" />
                        Real Payment Analytics
                      </h2>
                      <p className="text-green-100">Comprehensive insights into payment performance and trends</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={paymentTimeframe} onValueChange={setPaymentTimeframe}>
                        <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                      <p className="text-lg font-medium text-white/90 mb-2">Total Revenue</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(paymentAnalytics?.summary.totalRevenue || 0)}
                      </p>
                      <p className="text-sm text-white/70">
                        {paymentAnalytics?.summary.successfulPayments || 0} payments
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                      <p className="text-lg font-medium text-white/90 mb-2">Success Rate</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {paymentAnalytics?.summary.paymentSuccessRate.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-white/70">
                        {paymentAnalytics?.summary.successfulPayments || 0} of {paymentAnalytics?.summary.totalTransactions || 0}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                      <p className="text-lg font-medium text-white/90 mb-2">Average Transaction</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {formatCurrency(paymentAnalytics?.summary.averageTransactionValue || 0)}
                      </p>
                      <p className="text-sm text-white/70">Per successful payment</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                      <p className="text-lg font-medium text-white/90 mb-2">Conversion Rate</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {paymentAnalytics?.metrics.bookingToPaymentConversion.toFixed(1) || 0}%
                      </p>
                      <p className="text-sm text-white/70">
                        {paymentAnalytics?.metrics.totalBookings || 0} → {paymentAnalytics?.summary.successfulPayments || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Status Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="shadow-xl border-0 border-green-200">
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-green-600">
                        {paymentAnalytics?.summary.successfulPayments || 0}
                      </CardTitle>
                      <CardDescription className="text-gray-600">Completed Payments</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(paymentAnalytics?.breakdown.byStatus.find(s => s.status === 'COMPLETED')?.totalAmount || 0)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl border-0 border-red-200">
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-red-600">
                        {paymentAnalytics?.summary.failedPayments || 0}
                      </CardTitle>
                      <CardDescription className="text-gray-600">Failed Payments</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(paymentAnalytics?.breakdown.byStatus.find(s => s.status === 'FAILED')?.totalAmount || 0)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl border-0 border-yellow-200">
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-yellow-600">
                        {paymentAnalytics?.summary.pendingPayments || 0}
                      </CardTitle>
                      <CardDescription className="text-gray-600">Pending Payments</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(paymentAnalytics?.breakdown.byStatus.find(s => s.status === 'PENDING')?.totalAmount || 0)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl border-0 border-orange-200">
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                        <RefreshCw className="h-6 w-6 text-orange-600" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-orange-600">
                        {paymentAnalytics?.summary.refundedPayments || 0}
                      </CardTitle>
                      <CardDescription className="text-gray-600">Refunded</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(paymentAnalytics?.breakdown.byStatus.find(s => s.status === 'REFUNDED')?.totalAmount || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <CardTitle className="text-xl text-gray-900">Payment Transactions</CardTitle>
                    <CardDescription className="text-gray-600">
                      Recent VivaPayments transactions and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="font-semibold text-gray-900">Transaction ID</TableHead>
                            <TableHead className="font-semibold text-gray-900">Order Code</TableHead>
                            <TableHead className="font-semibold text-gray-900">Date/Time</TableHead>
                            <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                            <TableHead className="font-semibold text-gray-900">Amount</TableHead>
                            <TableHead className="font-semibold text-gray-900">Method</TableHead>
                            <TableHead className="font-semibold text-gray-900">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                              <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                              <TableCell className="font-mono text-sm">{payment.orderCode}</TableCell>
                              <TableCell className="text-sm text-gray-600">{formatDate(payment.date)}</TableCell>
                              <TableCell className="font-medium">{payment.customerName}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-gray-100">
                                  {payment.method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(payment.status)}
                                  <span className="text-sm">{payment.status}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {payment.status === 'FAILED' && (
                                      <DropdownMenuItem>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry Payment
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Content */}
              <TabsContent value="customers" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    icon={Users}
                    description="All time customers"
                    color="purple"
                  />
                  <MetricCard
                    title="New This Month"
                    value="--"
                    icon={User}
                    description="New signups"
                    color="blue"
                  />
                  <MetricCard
                    title="Repeat Customers"
                    value="--"
                    icon={Star}
                    description="Returning users"
                    color="green"
                  />
                </div>

                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">Customer Database</CardTitle>
                          <CardDescription className="text-gray-600">
                            Manage customer information and booking history
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search customers..."
                            className="border-0 focus:ring-0 w-full sm:w-48"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" className="bg-white hover:bg-gray-50">
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {customers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Data Loading...</h3>
                        <p className="text-gray-500 mb-4">Connecting to customer database to display real data.</p>
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="font-semibold text-gray-900">Customer</TableHead>
                              <TableHead className="font-semibold text-gray-900">Contact</TableHead>
                              <TableHead className="font-semibold text-gray-900">Total Bookings</TableHead>
                              <TableHead className="font-semibold text-gray-900">Total Spent</TableHead>
                              <TableHead className="font-semibold text-gray-900">Last Event</TableHead>
                              <TableHead className="font-semibold text-gray-900">Member Since</TableHead>
                              <TableHead className="font-semibold text-gray-900">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customers.map((customer) => (
                              <TableRow key={customer.id} className="hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src="" />
                                      <AvatarFallback className="text-xs">
                                        {customer.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-gray-900">{customer.name}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1 text-sm">
                                      <Mail className="h-3 w-3 text-gray-400" />
                                      {customer.email}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Phone className="h-3 w-3" />
                                      {customer.phone}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{customer.totalBookings}</TableCell>
                                <TableCell className="font-semibold text-purple-600">{formatCurrency(customer.totalSpent)}</TableCell>
                                <TableCell>{customer.lastEvent}</TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {new Date(customer.memberSince).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View History
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Customer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Events Content */}
              <TabsContent value="events" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Active Events"
                    value="--"
                    icon={Calendar}
                    description="Currently running"
                    color="blue"
                  />
                  <MetricCard
                    title="Tickets Sold"
                    value={stats?.totalBookings || 0}
                    icon={Ticket}
                    description="All events"
                    color="green"
                  />
                  <MetricCard
                    title="Total Capacity"
                    value="--"
                    icon={Users}
                    description="Combined capacity"
                    color="purple"
                  />
                </div>

                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Event Management Loading...</h3>
                  <p className="text-gray-500 mb-4">Connecting to event database to display real event data.</p>
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  </div>
                </div>
              </TabsContent>

              {/* N8N Status Content */}
              <TabsContent value="n8n" className="mt-6 space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Zap className="h-4 w-4" />
                  <AlertTitle className="text-blue-900">Active Workflows</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    N8N automation workflows for payment processing and ticket delivery
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {n8nStatus?.services.map((service) => (
                    <Card key={service.name} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium text-gray-900">{service.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(service.status)}
                            <span className="text-xs font-medium">{service.status}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600">{service.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="shadow-xl border-0">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">Recent N8N Executions</CardTitle>
                          <CardDescription className="text-gray-600">
                            Workflow executions and their status
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://tasos8.app.n8n.cloud', '_blank')}
                        className="hover:bg-purple-50"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Open N8N Dashboard
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="font-semibold text-gray-900">Workflow</TableHead>
                            <TableHead className="font-semibold text-gray-900">Trigger</TableHead>
                            <TableHead className="font-semibold text-gray-900">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900">Execution Time</TableHead>
                            <TableHead className="font-semibold text-gray-900">Order Code</TableHead>
                            <TableHead className="font-semibold text-gray-900">Customer Email</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {n8nStatus?.recentExecutions.map((execution, index) => (
                            <TableRow key={index} className="hover:bg-purple-50/50 transition-colors border-b border-gray-100">
                              <TableCell className="font-medium">{execution.workflow}</TableCell>
                              <TableCell>{execution.trigger}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(execution.status)}
                                  <span className="text-sm">{execution.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{execution.executionTime}s</TableCell>
                              <TableCell className="font-mono text-sm">{execution.orderCode}</TableCell>
                              <TableCell className="text-sm">{execution.customerEmail}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Enhanced Footer */}
        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-600 mb-2 md:mb-0">
                © 2024 LocaNoche. All rights reserved.
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                Built with
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-blue-600">Qualia Solutions</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}