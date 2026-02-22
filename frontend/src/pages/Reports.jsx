import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatError } from '@/utils/errorFormatter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shops, setShops] = useState([])
  const [period, setPeriod] = useState('daily')
  const [selectedShop, setSelectedShop] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportData, setReportData] = useState(null)
  const [paymentData, setPaymentData] = useState([])
  const [topProducts, setTopProducts] = useState([])

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchShops()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports()
    }
  }, [period, selectedShop, startDate, endDate])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const fetchReports = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    setLoading(true)
    try {
      // Fetch sales report
      const reportParams = new URLSearchParams({
        period,
        start_date: startDate,
        end_date: endDate,
      })
      if (selectedShop !== 'all') {
        reportParams.append('shop_id', selectedShop)
      }

      const [reportResponse, paymentResponse, productsResponse] = await Promise.all([
        api.get(`/sales/reports/?${reportParams.toString()}`),
        api.get(`/sales/reports/payment-methods/?${reportParams.toString()}`),
        api.get(`/sales/reports/top-products/?${reportParams.toString()}&limit=10`),
      ])

      setReportData(reportResponse.data)
      setPaymentData(paymentResponse.data.data || [])
      setTopProducts(productsResponse.data.data || [])
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch reports'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickDateRange = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (period === 'daily') {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    } else if (period === 'weekly') {
      return `Week of ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
    } else if (period === 'monthly') {
      return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    } else {
      return date.toLocaleDateString('en-IN', { year: 'numeric' })
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="heading-2 text-gray-900">Sales Reports</h1>
          <p className="body-small text-muted-foreground mt-1">
            Generate and analyze sales reports by period, shop, and date range
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="heading-4">Report Filters</CardTitle>
            <CardDescription>Select period, date range, and shop to generate reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="shop">Shop</Label>
                  <Select value={selectedShop} onValueChange={setSelectedShop}>
                    <SelectTrigger id="shop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Shops</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id.toString()}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(30)}
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(90)}
              >
                Last 90 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(365)}
              >
                Last Year
              </Button>
            </div>

            <Button onClick={fetchReports} disabled={loading || !startDate || !endDate}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <Card className="mb-6">
            <CardContent className="py-12 text-center">
              <p className="body-medium text-muted-foreground">Loading report data...</p>
            </CardContent>
          </Card>
        )}

        {reportData && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="border-0 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary.total_revenue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportData.summary.total_sales} transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary.total_sales}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary.average_sale)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per transaction
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary.total_discount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Discounts applied
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card className="mb-6 border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="heading-4">Revenue Trend</CardTitle>
                <CardDescription>Revenue over time for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatDate}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Revenue"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales Count Chart */}
            <Card className="mb-6 border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="heading-4">Sales Count</CardTitle>
                <CardDescription>Number of transactions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tickFormatter={formatDate}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value) => `${value} sales`}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Bar dataKey="total_sales" fill="#3b82f6" name="Sales Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Methods Pie Chart */}
            {paymentData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="heading-4">Payment Methods</CardTitle>
                    <CardDescription>Revenue breakdown by payment method</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={paymentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="total_revenue"
                        >
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products */}
                {topProducts.length > 0 && (
                  <Card className="border-0 shadow-soft">
                    <CardHeader>
                      <CardTitle className="heading-4">Top Products</CardTitle>
                      <CardDescription>Best selling products by quantity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" style={{ fontSize: '12px' }} />
                          <YAxis
                            dataKey="product_name"
                            type="category"
                            width={120}
                            style={{ fontSize: '12px' }}
                          />
                          <Tooltip formatter={(value) => `${value} units`} />
                          <Legend />
                          <Bar dataKey="total_quantity" fill="#f59e0b" name="Quantity Sold" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {!reportData && !loading && (
          <Card className="border-0 shadow-soft">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="body-medium text-muted-foreground">
                Select a date range and click "Generate Report" to view analytics
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

