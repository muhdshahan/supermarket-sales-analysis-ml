import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppLayout from '@/components/AppLayout'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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

const CustomTooltip = ({ active, payload, label, currency = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-100 p-3 shadow-xl rounded-xl">
        {label && (
          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {new Date(label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-sm font-bold text-gray-900">
              {entry.name}: <span className="text-primary">{currency ? `₹${entry.value.toLocaleString('en-IN')}` : entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

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
  const isStaff = user?.role === 'staff'
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

      // Fetch data in parallel
      const apiCalls = [
        api.get('/shops/').catch(() => ({ data: [] })),
        api.get('/products/categories/').catch(() => ({ data: [] })),
        api.get('/products/').catch(() => ({ data: [] })),
      ]

      // Only fetch sales reports if not staff
      if (!isStaff) {
        apiCalls.push(api.get(`/sales/reports/?${params.toString()}`).catch(() => ({ data: null })))
        apiCalls.push(api.get(`/sales/reports/payment-methods/?${params.toString()}`).catch(() => ({ data: { data: [] } })))
        apiCalls.push(api.get(`/sales/reports/top-products/?${params.toString()}&limit=5`).catch(() => ({ data: { data: [] } })))
      }

      const results = await Promise.all(apiCalls)

      const [shopsRes, categoriesRes, productsRes] = results
      const salesRes = isStaff ? { data: null } : results[3]
      const paymentRes = isStaff ? { data: { data: [] } } : results[4]
      const topProductsRes = isStaff ? { data: { data: [] } } : results[5]

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

          {!isStaff && (
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
          )}
        </div>

        {/* Sales Stats Cards - Hidden for Staff */}
        {!isStaff && (
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
        )}

        {/* Charts - Hidden for Staff */}
        {!isStaff && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Area Chart */}
            {salesData.length > 0 && (
              <Card className="border-0 shadow-soft overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-white to-green-50/30 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="heading-4 text-gray-900">Revenue Performance</CardTitle>
                      <CardDescription>Daily revenue trends (Last 30 Days)</CardDescription>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="period"
                        tickFormatter={formatDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip currency={true} />} />
                      <Area
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={1500}
                        name="Revenue"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods Distribution */}
            {paymentData.length > 0 && (
              <Card className="border-0 shadow-soft overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="heading-4 text-gray-900">Payment Breakdown</CardTitle>
                      <CardDescription>Revenue share by channel</CardDescription>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="total_revenue"
                        animationDuration={1500}
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip currency={true} />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-sm font-medium text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top Products - Hidden for Staff */}
        {!isStaff && !loading && topProducts.length > 0 && (
          <Card className="mb-8 border-0 shadow-soft overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-white to-primary/5 border-b border-gray-100">
              <CardTitle className="heading-4 text-gray-900">Top Performing Products</CardTitle>
              <CardDescription>Best sellers by quantity (Last 30 Days)</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="product_name"
                    type="category"
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="total_quantity"
                    fill="url(#colorBar)"
                    name="Quantity Sold"
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  >
                    <defs>
                      <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </Bar>
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

