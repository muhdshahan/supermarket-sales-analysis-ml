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
import { Package, Eye, Filter, ArrowRight, Loader2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function TransferHistory() {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFromShop, setFilterFromShop] = useState('all')
  const [filterToShop, setFilterToShop] = useState('all')

  // Fetch data
  useEffect(() => {
    fetchShops()
    fetchTransfers()
  }, [filterStatus, filterFromShop, filterToShop])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      let url = '/transfers/'
      const params = new URLSearchParams()
      
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }
      if (filterFromShop !== 'all') {
        params.append('from_shop_id', filterFromShop)
      }
      if (filterToShop !== 'all') {
        params.append('to_shop_id', filterToShop)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await api.get(url)
      setTransfers(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch transfers'))
    } finally {
      setLoading(false)
    }
  }

  const viewTransferDetails = async (transferId) => {
    try {
      const response = await api.get(`/transfers/${transferId}/`)
      setSelectedTransfer(response.data)
      setIsDetailDialogOpen(true)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch transfer details'))
    }
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

  const getStatusBadge = (status) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Get available shops based on user role
  const availableShops = user?.role === 'sales_manager' && user?.shop
    ? shops.filter(s => {
        // Handle shop as object or ID
        let shopId = null
        if (typeof user.shop === 'object' && user.shop !== null && user.shop.id) {
          shopId = user.shop.id
        } else if (typeof user.shop === 'number') {
          shopId = user.shop
        }
        return s.id === shopId
      })
    : shops

  // Count transfers by status
  const statusCounts = {
    pending: transfers.filter(t => t.status === 'pending').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    completed: transfers.filter(t => t.status === 'completed').length,
    rejected: transfers.filter(t => t.status === 'rejected').length,
    cancelled: transfers.filter(t => t.status === 'cancelled').length,
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="heading-2 text-gray-900">Transfer History</h1>
          <p className="body-small text-muted-foreground mt-1">View all transfer requests</p>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{transfers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Rejected/Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.rejected + statusCounts.cancelled}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">From Shop</label>
                <Select value={filterFromShop} onValueChange={setFilterFromShop}>
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
                <label className="text-sm font-medium">To Shop</label>
                <Select value={filterToShop} onValueChange={setFilterToShop}>
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
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transfers</CardTitle>
            <CardDescription>View all stock transfer requests and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transfers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No transfers found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>From Shop</TableHead>
                      <TableHead>To Shop</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">#{transfer.id}</TableCell>
                        <TableCell>{transfer.product_name}</TableCell>
                        <TableCell>{transfer.from_shop_name}</TableCell>
                        <TableCell>{transfer.to_shop_name}</TableCell>
                        <TableCell>{transfer.quantity}</TableCell>
                        <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                        <TableCell>{transfer.requested_by_username}</TableCell>
                        <TableCell>{formatDate(transfer.requested_at)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewTransferDetails(transfer.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transfer Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transfer Details</DialogTitle>
              <DialogDescription>
                Complete information about this transfer
              </DialogDescription>
            </DialogHeader>
            {selectedTransfer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Transfer ID</label>
                    <p className="font-semibold">#{selectedTransfer.id}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div>{getStatusBadge(selectedTransfer.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Product</label>
                    <p className="font-semibold">{selectedTransfer.product_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Quantity</label>
                    <p className="font-semibold">{selectedTransfer.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">From Shop</label>
                    <p className="font-semibold">{selectedTransfer.from_shop_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">To Shop</label>
                    <p className="font-semibold">{selectedTransfer.to_shop_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Requested By</label>
                    <p className="font-semibold">{selectedTransfer.requested_by_username}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Requested At</label>
                    <p className="font-semibold">{formatDate(selectedTransfer.requested_at)}</p>
                  </div>
                  {selectedTransfer.approved_by_username && (
                    <>
                      <div>
                        <label className="text-sm text-muted-foreground">Approved By</label>
                        <p className="font-semibold">{selectedTransfer.approved_by_username}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Approved At</label>
                        <p className="font-semibold">{formatDate(selectedTransfer.approved_at)}</p>
                      </div>
                    </>
                  )}
                  {selectedTransfer.completed_at && (
                    <div>
                      <label className="text-sm text-muted-foreground">Completed At</label>
                      <p className="font-semibold">{formatDate(selectedTransfer.completed_at)}</p>
                    </div>
                  )}
                </div>
                {selectedTransfer.notes && (
                  <div>
                    <label className="text-sm text-muted-foreground">Notes</label>
                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedTransfer.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
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

