import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAlerts } from '@/context/AlertContext'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { unreadCount } = useAlerts()
  const navigate = useNavigate()
  const [shopCount, setShopCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState(0)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    // Fetch shop count
    api.get('/shops/')
      .then(response => {
        setShopCount(response.data.length)
      })
      .catch(() => {
        // Silently fail - just show 0
      })
    
    // Fetch category count
    api.get('/products/categories/')
      .then(response => {
        setCategoryCount(response.data.length)
      })
      .catch(() => {
        // Silently fail - just show 0
      })
    
    // Fetch product count
    api.get('/products/')
      .then(response => {
        setProductCount(response.data.length)
      })
      .catch(() => {
        // Silently fail - just show 0
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow transform transition-transform duration-300 hover:scale-105">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <h1 className="heading-3 text-gray-900">Supermarket Sales</h1>
            </div>
            <div className="flex items-center space-x-4">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/alerts')}
                  className="relative border-2 border-warning/20 hover:border-warning/40 bg-warning/5 hover:bg-warning/10 transition-all duration-200"
                >
                  <Bell className="h-5 w-5 text-warning" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-medium animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="ml-2 hidden sm:inline font-medium">Alerts</span>
                </Button>
              )}
              <div className="text-right hidden sm:block">
                <p className="body-small font-semibold text-gray-900">{user?.username}</p>
                <p className="caption capitalize text-muted-foreground">{user?.role?.replace('_', ' ')}</p>
              </div>
              <Button 
                onClick={logout} 
                variant="outline"
                className="border-2 hover:bg-destructive/5 hover:border-destructive hover:text-destructive transition-all duration-200 font-medium"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.username}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shopCount}</div>
              <p className="text-xs text-muted-foreground">Active shops</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryCount}</div>
              <p className="text-xs text-muted-foreground">Product categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productCount}</div>
              <p className="text-xs text-muted-foreground">Products in catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/shops')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Shops</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </CardTitle>
              <CardDescription>Manage shops and branches</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Shops</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/categories')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Categories</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </CardTitle>
              <CardDescription>Manage product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Categories</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/products')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Products</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </CardTitle>
              <CardDescription>Manage product catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Products</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/inventory')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Inventory</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </CardTitle>
              <CardDescription>Manage stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Inventory</Button>
            </CardContent>
          </Card>

          {user?.role === 'admin' && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/users')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Users</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </CardTitle>
                <CardDescription>Manage users and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">View Users</Button>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/billing')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Billing</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardTitle>
              <CardDescription>Create sales and bills</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">Go to Billing</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/sales')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sales History</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </CardTitle>
              <CardDescription>View sales and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Sales</Button>
            </CardContent>
          </Card>

          {(user?.role === 'sales_manager' || user?.role === 'admin') && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/transfers/request')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Request Transfer</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </CardTitle>
                <CardDescription>Request stock transfer between shops</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Request Transfer</Button>
              </CardContent>
            </Card>
          )}

          {user?.role === 'admin' && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/transfers/manage')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Manage Transfers</span>
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </CardTitle>
                <CardDescription>Approve and manage transfer requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Manage Transfers</Button>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/transfers/history')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transfer History</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </CardTitle>
              <CardDescription>View all transfer requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View History</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/alerts')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Alerts</span>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </CardTitle>
              <CardDescription>View system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Alerts</Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Supermarket Sales System</CardTitle>
            <CardDescription>
              Manage your supermarket operations efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This is your dashboard. Here you can manage shops, products, sales, and inventory.
              More features will be available as we build them.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

