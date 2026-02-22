import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatError } from '@/utils/errorFormatter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, Filter, Loader2, CheckCheck } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const ALERT_TYPE_ICONS = {
  low_stock: AlertTriangle,
  stockout_risk: AlertCircle,
  high_demand: Bell,
  seasonal: Info,
}

const ALERT_TYPE_LABELS = {
  low_stock: 'Low Stock',
  stockout_risk: 'Stockout Risk',
  high_demand: 'High Demand',
  seasonal: 'Seasonal',
}

export default function Alerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [markingRead, setMarkingRead] = useState(false)
  
  // Filters
  const [filterShop, setFilterShop] = useState('all')
  const [filterAlertType, setFilterAlertType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterIsRead, setFilterIsRead] = useState('false') // Default to unread only

  // Fetch data
  useEffect(() => {
    fetchShops()
    fetchAlerts()
  }, [filterShop, filterAlertType, filterSeverity, filterIsRead])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      let url = '/alerts/'
      const params = new URLSearchParams()
      
      if (filterShop !== 'all') {
        params.append('shop_id', filterShop)
      }
      if (filterAlertType !== 'all') {
        params.append('alert_type', filterAlertType)
      }
      if (filterSeverity !== 'all') {
        params.append('severity', filterSeverity)
      }
      if (filterIsRead !== 'all') {
        params.append('is_read', filterIsRead)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await api.get(url)
      setAlerts(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch alerts'))
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId) => {
    try {
      setMarkingRead(true)
      await api.put(`/alerts/${alertId}/read/`)
      toast.success('Alert marked as read')
      fetchAlerts()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to mark alert as read'))
    } finally {
      setMarkingRead(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      setMarkingRead(true)
      await api.put('/alerts/mark-all-read/')
      toast.success('All alerts marked as read')
      fetchAlerts()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to mark all alerts as read'))
    } finally {
      setMarkingRead(false)
    }
  }

  const viewAlertDetails = (alert) => {
    setSelectedAlert(alert)
    setIsDetailDialogOpen(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityBadge = (severity) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    )
  }

  const getAlertTypeIcon = (alertType) => {
    const Icon = ALERT_TYPE_ICONS[alertType] || Info
    return <Icon className="h-4 w-4" />
  }

  // Get available shops based on user role
  const availableShops = user?.role === 'sales_manager' && user?.shop
    ? shops.filter(s => {
        let shopId = null
        if (typeof user.shop === 'object' && user.shop !== null && user.shop.id) {
          shopId = user.shop.id
        } else if (typeof user.shop === 'number') {
          shopId = user.shop
        }
        return s.id === shopId
      })
    : shops

  // Count alerts
  const unreadCount = alerts.filter(a => !a.is_read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_read).length
  const highCount = alerts.filter(a => a.severity === 'high' && !a.is_read).length

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">Alerts</h1>
            <p className="body-small text-muted-foreground mt-1">View system alerts and notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={markingRead}
              variant="outline"
              className="flex items-center gap-2 border-2 hover:bg-primary/5 hover:border-primary"
            >
                {markingRead ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    Mark All Read ({unreadCount})
                  </>
                )}
              </Button>
            )}
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total Alerts</p>
              <p className="text-2xl font-bold">{alerts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Unread</p>
              <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{highCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shop</label>
                <Select value={filterShop} onValueChange={setFilterShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="All shops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {availableShops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alert Type</label>
                <Select value={filterAlertType} onValueChange={setFilterAlertType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="stockout_risk">Stockout Risk</SelectItem>
                    <SelectItem value="high_demand">High Demand</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterIsRead} onValueChange={setFilterIsRead}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="false">Unread</SelectItem>
                    <SelectItem value="true">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Alerts</CardTitle>
            <CardDescription>View and manage system alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No alerts found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className={!alert.is_read ? 'bg-yellow-50' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.alert_type)}
                            <span className="text-sm">
                              {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{alert.message}</p>
                        </TableCell>
                        <TableCell>{alert.shop_name}</TableCell>
                        <TableCell>{alert.product_name || 'N/A'}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>
                          {alert.is_read ? (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Read
                            </span>
                          ) : (
                            <span className="text-sm text-yellow-600 font-medium">Unread</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(alert.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewAlertDetails(alert)}
                            >
                              View
                            </Button>
                            {!alert.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                                disabled={markingRead}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Alert Details</DialogTitle>
              <DialogDescription>
                Complete information about this alert
              </DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Alert ID</label>
                    <p className="font-semibold">#{selectedAlert.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Type</label>
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(selectedAlert.alert_type)}
                      <p className="font-semibold">
                        {ALERT_TYPE_LABELS[selectedAlert.alert_type] || selectedAlert.alert_type}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Severity</label>
                    <div>{getSeverityBadge(selectedAlert.severity)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <p className="font-semibold">
                      {selectedAlert.is_read ? 'Read' : 'Unread'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Shop</label>
                    <p className="font-semibold">{selectedAlert.shop_name}</p>
                  </div>
                  {selectedAlert.product_name && (
                    <div>
                      <label className="text-sm text-muted-foreground">Product</label>
                      <p className="font-semibold">{selectedAlert.product_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-muted-foreground">Created At</label>
                    <p className="font-semibold">{formatDate(selectedAlert.created_at)}</p>
                  </div>
                  {selectedAlert.read_at && (
                    <div>
                      <label className="text-sm text-muted-foreground">Read At</label>
                      <p className="font-semibold">{formatDate(selectedAlert.read_at)}</p>
                    </div>
                  )}
                  {selectedAlert.read_by_username && (
                    <div>
                      <label className="text-sm text-muted-foreground">Read By</label>
                      <p className="font-semibold">{selectedAlert.read_by_username}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Message</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedAlert.message}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              {selectedAlert && !selectedAlert.is_read && (
                <Button
                  onClick={() => {
                    markAsRead(selectedAlert.id)
                    setIsDetailDialogOpen(false)
                  }}
                  disabled={markingRead}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}




