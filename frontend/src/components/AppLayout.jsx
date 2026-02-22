import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAlerts } from '@/context/AlertContext'
import { Button } from '@/components/ui/button'
import { Bell, Menu, LogOut } from 'lucide-react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useAlerts()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-gray-100 sticky top-0 z-40">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Desktop Spacer */}
              <div className="hidden lg:block" />
              
              {/* Right Side Actions */}
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
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

