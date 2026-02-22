import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppLayout from '@/components/AppLayout'
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { user } = useAuth()
  const [shopCount, setShopCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [salesData, setSalesData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [salesSummary, setSalesSummary] = useState({
    total_revenue: 0,
    total_sales: 0,
    average_sale: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Set date range for last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]
      
      const params = new URLSearchParams({
        period: 'daily',
        start_date: startDateStr,
        end_date: endDateStr,
      })
      
      // If user is not admin, filter by their shop
      if (user?.role !== 'admin' && user?.shop) {
        const shopId = typeof user.shop === 'object' ? user.shop.id : user.shop
        if (shopId) {
          params.append('shop_id', shopId.toString())
        }
      }

      // Fetch all data in parallel
      const [shopsRes, categoriesRes, productsRes, salesRes, paymentRes, topProductsRes] = await Promise.all([
        api.get('/shops/').catch(() => ({ data: [] })),
        api.get('/products/categories/').catch(() => ({ data: [] })),
        api.get('/products/').catch(() => ({ data: [] })),
        api.get(`/sales/reports/?${params.toString()}`).catch(() => ({ data: null })),
        api.get(`/sales/reports/payment-methods/?${params.toString()}`).catch(() => ({ data: { data: [] } })),
        api.get(`/sales/reports/top-products/?${params.toString()}&limit=5`).catch(() => ({ data: { data: [] } })),
      ])

      setShopCount(shopsRes.data.length)
      setCategoryCount(categoriesRes.data.length)
      setProductCount(productsRes.data.length)
      
      if (salesRes.data) {
        setSalesData(salesRes.data.data || [])
        setSalesSummary({
          total_revenue: salesRes.data.summary?.total_revenue || 0,
          total_sales: salesRes.data.summary?.total_sales || 0,
          average_sale: salesRes.data.summary?.average_sale || 0,
        })
      }
      
      setPaymentData(paymentRes.data.data || [])
      setTopProducts(topProductsRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.username}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-hover border-0 shadow-soft bg-gradient-to-br from-white to-green-50/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="label-text text-gray-700">Total Shops</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-glow">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{shopCount}</div>
              <p className="caption">Active shops</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-gradient-to-br from-white to-blue-50/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="label-text text-gray-700">Total Categories</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-glow-blue">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{categoryCount}</div>
              <p className="caption">Product categories</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-gradient-to-br from-white to-indigo-50/50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="label-text text-gray-700">Total Products</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-glow-blue">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{productCount}</div>
              <p className="caption">Products in catalog</p>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-soft bg-gradient-to-br from-white to-purple-50/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="label-text text-gray-700">Total Revenue</CardTitle>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-glow">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {loading ? '...' : formatCurrency(salesSummary.total_revenue)}
              </div>
              <p className="caption">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : salesSummary.total_sales}</div>
              <p className="text-xs text-muted-foreground mt-1">Transactions (30 days)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : formatCurrency(salesSummary.average_sale)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {salesData.length > 1 && !loading
                  ? salesData[salesData.length - 1].total_revenue > salesData[0].total_revenue
                    ? '↑'
                    : '↓'
                  : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            {salesData.length > 0 && (
              <Card className="border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="heading-4">Revenue Trend (Last 30 Days)</CardTitle>
                  <CardDescription>Daily revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData}>
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
            )}

            {/* Payment Methods Pie Chart */}
            {paymentData.length > 0 && (
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
            )}
          </div>
        )}

        {/* Top Products */}
        {!loading && topProducts.length > 0 && (
          <Card className="mb-8 border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="heading-4">Top Selling Products (Last 30 Days)</CardTitle>
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
                    width={150}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip formatter={(value) => `${value} units`} />
                  <Legend />
                  <Bar dataKey="total_quantity" fill="#3b82f6" name="Quantity Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Welcome Card */}
        <Card className="border-0 shadow-soft bg-gradient-to-br from-white to-primary/5">
          <CardHeader>
            <CardTitle className="heading-3 text-gray-900">Welcome to Supermarket Sales System</CardTitle>
            <CardDescription className="body-medium mt-2">
              Manage your supermarket operations efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="body-medium text-gray-700">
              This is your dashboard. Use the sidebar to navigate to different sections. 
              Here you can view key metrics and manage shops, products, sales, and inventory.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

