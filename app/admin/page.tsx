"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  ChevronDown
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, paymentsRes, customersRes, n8nRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/customers'),
        fetch('/api/admin/n8n-status')
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

  const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }: {
    title: string
    value: string | number
    icon: any
    trend?: "up" | "down"
    color?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={trend === "up" ? "text-green-500" : "text-red-500"}>
              {trend === "up" ? "+12%" : "-2.3%"}
            </span>
            from last event
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Site
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">LN</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">LocaNoche Admin</h1>
                    <p className="text-sm text-gray-600">Oktoberfest Event Management</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Bookings
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="n8n" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  N8N Status
                </TabsTrigger>
              </TabsList>

              {/* Dashboard Content */}
              <TabsContent value="dashboard" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats?.totalRevenue || 0)}
                    icon={TrendingUp}
                    trend="up"
                    color="green"
                  />
                  <StatCard
                    title="Tickets Sold"
                    value={stats?.totalBookings || 0}
                    icon={Calendar}
                    trend="up"
                    color="blue"
                  />
                  <StatCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    icon={Users}
                    trend="up"
                    color="purple"
                  />
                  <StatCard
                    title="Payment Success Rate"
                    value={`${stats?.paymentSuccessRate || 0}%`}
                    icon={Activity}
                    trend="up"
                    color="green"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Recent Bookings</CardTitle>
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </div>
                    <CardDescription>
                      Latest ticket purchases and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Tickets</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.recentBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                            <TableCell>{booking.customerName}</TableCell>
                            <TableCell>{booking.eventName}</TableCell>
                            <TableCell>{booking.tickets}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(booking.amount)}</TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bookings Content */}
              <TabsContent value="bookings" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>All Bookings</CardTitle>
                        <CardDescription>
                          Manage and monitor all ticket bookings
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search bookings..."
                            className="w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                        <Button>
                          Add Manual Booking
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertTitle>Bookings Management</AlertTitle>
                      <AlertDescription>
                        Connect to booking API to display real booking data. Currently showing placeholder content.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payments Content */}
              <TabsContent value="payments" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{formatCurrency(stats?.totalRevenue || 0)}</CardTitle>
                      <CardDescription>Total Processed</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{stats?.successfulPayments || 0}</CardTitle>
                      <CardDescription>Successful Payments</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {formatCurrency((stats?.totalRevenue || 0) / (stats?.totalBookings || 1))}
                      </CardTitle>
                      <CardDescription>Average Transaction</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Transactions</CardTitle>
                    <CardDescription>
                      Recent VivaPayments transactions and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Order Code</TableHead>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                            <TableCell className="font-mono text-sm">{payment.orderCode}</TableCell>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Content */}
              <TabsContent value="customers" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{stats?.totalCustomers || 0}</CardTitle>
                      <CardDescription>Total Customers</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">156</CardTitle>
                      <CardDescription>New This Month</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">412</CardTitle>
                      <CardDescription>Repeat Customers</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Customer Database</CardTitle>
                        <CardDescription>
                          Manage customer information and booking history
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search customers..."
                            className="w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Total Bookings</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Last Event</TableHead>
                          <TableHead>Member Since</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell>{customer.totalBookings}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(customer.totalSpent)}</TableCell>
                            <TableCell>{customer.lastEvent}</TableCell>
                            <TableCell>{new Date(customer.memberSince).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Events Content */}
              <TabsContent value="events" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">2</CardTitle>
                      <CardDescription>Active Events</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{stats?.totalBookings || 0}</CardTitle>
                      <CardDescription>Total Tickets Sold</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">2,000</CardTitle>
                      <CardDescription>Total Capacity</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Event 1: Oktoberfest - Minus One</CardTitle>
                      <CardDescription>Manage event details and ticket pricing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Event Date</label>
                          <Input type="date" defaultValue="2024-10-11" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Event Time</label>
                          <Input type="time" defaultValue="17:00" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Adult Ticket Price (€)</label>
                          <Input type="number" defaultValue="10" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Child Ticket Price (€)</label>
                          <Input type="number" defaultValue="5" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Adult Tickets Available</label>
                          <Input type="number" defaultValue="800" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Child Tickets Available</label>
                          <Input type="number" defaultValue="200" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button>Update Event</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Event 2: Oktoberfest - Giannis Margaris</CardTitle>
                      <CardDescription>Manage event details and ticket pricing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Event Date</label>
                          <Input type="date" defaultValue="2024-10-12" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Event Time</label>
                          <Input type="time" defaultValue="17:00" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Adult Ticket Price (€)</label>
                          <Input type="number" defaultValue="10" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Child Ticket Price (€)</label>
                          <Input type="number" defaultValue="5" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Adult Tickets Available</label>
                          <Input type="number" defaultValue="800" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Child Tickets Available</label>
                          <Input type="number" defaultValue="200" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button>Update Event</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* N8N Status Content */}
              <TabsContent value="n8n" className="mt-6 space-y-6">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertTitle>Active Workflows</AlertTitle>
                  <AlertDescription>
                    N8N automation workflows for payment processing and ticket delivery
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {n8nStatus?.services.map((service) => (
                    <Card key={service.name}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm">{service.name}</CardTitle>
                          {getStatusBadge(service.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-gray-600">{service.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Recent N8N Executions</CardTitle>
                        <CardDescription>
                          Workflow executions and their status
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://tasos8.app.n8n.cloud', '_blank')}
                      >
                        Open N8N Dashboard
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Workflow</TableHead>
                          <TableHead>Trigger</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Execution Time</TableHead>
                          <TableHead>Order Code</TableHead>
                          <TableHead>Customer Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {n8nStatus?.recentExecutions.map((execution, index) => (
                          <TableRow key={index}>
                            <TableCell>{execution.workflow}</TableCell>
                            <TableCell>{execution.trigger}</TableCell>
                            <TableCell>{getStatusBadge(execution.status)}</TableCell>
                            <TableCell>{execution.executionTime}s</TableCell>
                            <TableCell className="font-mono text-sm">{execution.orderCode}</TableCell>
                            <TableCell>{execution.customerEmail}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}