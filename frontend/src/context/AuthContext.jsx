import { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
        // Verify token is still valid and refresh user data
        api.get('/auth/profile/')
          .then(response => {
            const updatedUser = response.data
            localStorage.setItem('user', JSON.stringify(updatedUser))
            setUser(updatedUser)
          })
          .catch(() => {
            logout()
          })
      } catch (error) {
        logout()
      }
    }
    setLoading(false)
  }, [])
  
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile/')
      const updatedUser = response.data
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to refresh user data',
      }
    }
  }

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      const { user, access, refresh } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData)
      const { user, access, refresh } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

