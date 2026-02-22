import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useAlerts } from '@/context/AlertContext'
import { 
  LayoutDashboard, 
  Building2, 
  Tag, 
  Package, 
  Warehouse,
  ShoppingCart,
  Receipt,
  ArrowLeftRight,
  ClipboardList,
  History,
  Bell,
  Users,
  X,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Management',
    type: 'section',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Shops',
    icon: Building2,
    path: '/shops',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Categories',
    icon: Tag,
    path: '/categories',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Products',
    icon: Package,
    path: '/products',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Inventory',
    icon: Warehouse,
    path: '/inventory',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Operations',
    type: 'section',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Billing',
    icon: ShoppingCart,
    path: '/billing',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Sales',
    icon: Receipt,
    path: '/sales',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Reports',
    icon: FileText,
    path: '/reports',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Transfers',
    type: 'section',
    roles: ['admin', 'sales_manager']
  },
  {
    title: 'Request Transfer',
    icon: ArrowLeftRight,
    path: '/transfers/request',
    roles: ['admin', 'sales_manager']
  },
  {
    title: 'Manage Transfers',
    icon: ClipboardList,
    path: '/transfers/manage',
    roles: ['admin']
  },
  {
    title: 'Transfer History',
    icon: History,
    path: '/transfers/history',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'System',
    type: 'section',
    roles: ['admin', 'sales_manager', 'staff']
  },
  {
    title: 'Alerts',
    icon: Bell,
    path: '/alerts',
    roles: ['admin', 'sales_manager', 'staff'],
    badge: true
  },
  {
    title: 'Users',
    icon: Users,
    path: '/users',
    roles: ['admin']
  }
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const { unreadCount } = useAlerts()
  const location = useLocation()
  
  const filteredMenuItems = menuItems.filter(item => {
    if (item.type === 'section') return true
    return item.roles?.includes(user?.role)
  })
  
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 shadow-large",
        "lg:relative lg:z-auto lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Content */}
        <div className="flex flex-col h-full w-64">
          {/* Logo/Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <h1 className="heading-4 text-gray-900">Supermarket</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {filteredMenuItems.map((item, index) => {
              if (item.type === 'section') {
                return (
                  <div key={index} className="px-3 py-2 mt-4 mb-2 first:mt-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.title}
                    </p>
                  </div>
                )
              }
              
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
              const Icon = item.icon
              const showBadge = item.badge && unreadCount > 0
              
              return (
                <NavLink
                  key={index}
                  to={item.path}
                  onClick={() => {
                    // Close mobile menu on navigation
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 relative",
                    "hover:bg-gray-100",
                    isActive && "bg-primary/10 text-primary font-semibold",
                    !isActive && "text-gray-700"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-gray-500"
                  )} />
                  <span className="flex-1">{item.title}</span>
                  {showBadge && (
                    <span className="bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
          
          {/* User Info Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-small font-semibold text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="caption capitalize text-muted-foreground">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

