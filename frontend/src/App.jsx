import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AlertProvider } from '@/context/AlertContext'
import { Toaster } from '@/components/ui/sonner'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Shops from '@/pages/Shops'
import Categories from '@/pages/Categories'
import Products from '@/pages/Products'
import Inventory from '@/pages/Inventory'
import Users from '@/pages/Users'
import Billing from '@/pages/Billing'
import Sales from '@/pages/Sales'
import RequestTransfer from '@/pages/RequestTransfer'
import ManageTransfers from '@/pages/ManageTransfers'
import TransferHistory from '@/pages/TransferHistory'
import Alerts from '@/pages/Alerts'
import Reports from '@/pages/Reports'
import ProtectedRoute from '@/components/ProtectedRoute'

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops"
        element={
          <ProtectedRoute>
            <Shops />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <Billing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers/request"
        element={
          <ProtectedRoute>
            <RequestTransfer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers/manage"
        element={
          <ProtectedRoute>
            <ManageTransfers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfers/history"
        element={
          <ProtectedRoute>
            <TransferHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </AlertProvider>
    </AuthProvider>
  )
}

export default App
