import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from './AuthContext'

const AlertContext = createContext(null)

export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider')
  }
  return context
}

export const AlertProvider = ({ children }) => {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const lastCheckedRef = useRef(null)
  const intervalRef = useRef(null)
  const isInitialMountRef = useRef(true)

  // Check for new alerts
  const checkForNewAlerts = useCallback(async (showToast = true) => {
    if (!user) return

    try {
      const response = await api.get('/alerts/?is_read=false')
      const unreadAlerts = response.data
      
      // If we have a last checked time, only show new alerts
      if (lastCheckedRef.current && showToast && !isInitialMountRef.current) {
        const newAlerts = unreadAlerts.filter(alert => {
          const alertDate = new Date(alert.created_at)
          return alertDate > lastCheckedRef.current
        })
        
        // Show toast for each new alert
        newAlerts.forEach(alert => {
          const severityConfig = {
            critical: { type: 'error', icon: '🔴' },
            high: { type: 'error', icon: '🟠' },
            medium: { type: 'warning', icon: '🟡' },
            low: { type: 'info', icon: '🔵' }
          }
          
          const config = severityConfig[alert.severity] || { type: 'info', icon: 'ℹ️' }
          
          toast[config.type](`${config.icon} ${alert.message}`, {
            description: `${alert.shop_name}${alert.product_name ? ` - ${alert.product_name}` : ''}`,
            duration: 6000,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/alerts'
            }
          })
        })
      }
      
      setUnreadCount(unreadAlerts.length)
      lastCheckedRef.current = new Date()
      isInitialMountRef.current = false
    } catch (error) {
      console.error('Failed to check alerts:', error)
    }
  }, [user])

  // Check alerts on mount and periodically
  useEffect(() => {
    if (user) {
      // Initial check without toast
      checkForNewAlerts(false)
      
      // Check every 30 seconds
      intervalRef.current = setInterval(() => {
        checkForNewAlerts(true)
      }, 30000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      setUnreadCount(0)
      lastCheckedRef.current = null
      isInitialMountRef.current = true
    }
  }, [user, checkForNewAlerts])

  return (
    <AlertContext.Provider value={{ unreadCount, checkForNewAlerts }}>
      {children}
    </AlertContext.Provider>
  )
}

