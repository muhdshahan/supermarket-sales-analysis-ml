import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useAlerts } from '@/context/AlertContext'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatError } from '@/utils/errorFormatter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { CheckCircle2, XCircle, Package, ArrowRight, Eye, Loader2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function ManageTransfers() {
  const { user } = useAuth()
  const { checkForNewAlerts } = useAlerts()
  const [transfers, setTransfers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [actionNotes, setActionNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFromShop, setFilterFromShop] = useState('all')
  const [filterToShop, setFilterToShop] = useState('all')

  // Only admin can access
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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

  const openActionDialog = (transfer, action) => {
    setSelectedTransfer(transfer)
    setActionType(action)
    setActionNotes('')
    setIsActionDialogOpen(true)
  }

  const handleAction = async () => {
    if (!selectedTransfer || !actionType) return

    setProcessing(true)
    try {
      let endpoint = ''
      let payload = {}
      
      if (actionNotes.trim()) {
        payload.notes = actionNotes.trim()
      }

      switch (actionType) {
        case 'approve':
          endpoint = `/transfers/${selectedTransfer.id}/approve/`
          break
        case 'reject':
          endpoint = `/transfers/${selectedTransfer.id}/reject/`
          break
        case 'complete':
          endpoint = `/transfers/${selectedTransfer.id}/complete/`
          break
        default:
          return
      }

      await api.post(endpoint, payload)
      
      const actionMessages = {
        approve: 'Transfer approved successfully',
        reject: 'Transfer rejected',
        complete: 'Transfer completed and stock updated',
      }
      
      toast.success(actionMessages[actionType])
      
      // Check for new alerts after transfer completion (stock was updated)
      if (actionType === 'complete') {
        setTimeout(() => {
          checkForNewAlerts(true)
        }, 1000)
      }
      
      setIsActionDialogOpen(false)
      setSelectedTransfer(null)
      setActionType(null)
      setActionNotes('')
      fetchTransfers()
    } catch (error) {
      toast.error(formatError(error.response?.data || `Failed to ${actionType} transfer`))
    } finally {
      setProcessing(false)
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

  // Count transfers by status
  const pendingCount = transfers.filter(t => t.status === 'pending').length
  const approvedCount = transfers.filter(t => t.status === 'approved').length

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="heading-2 text-gray-900">Manage Transfers</h1>
          <p className="body-small text-muted-foreground mt-1">Approve and manage transfer requests</p>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Total Transfers</p>
              <p className="text-2xl font-bold">{transfers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">Approved (Ready to Complete)</p>
              <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
                <Label>From Shop</Label>
                <Select value={filterFromShop} onValueChange={setFilterFromShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="All shops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Shop</Label>
                <Select value={filterToShop} onValueChange={setFilterToShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="All shops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {shops.map((shop) => (
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
            <CardTitle>Transfers</CardTitle>
            <CardDescription>Manage stock transfer requests</CardDescription>
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
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewTransferDetails(transfer.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {transfer.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openActionDialog(transfer, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openActionDialog(transfer, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {transfer.status === 'approved' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openActionDialog(transfer, 'complete')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Complete
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

        {/* Transfer Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transfer Details</DialogTitle>
              <DialogDescription>
                View complete information about this transfer
              </DialogDescription>
            </DialogHeader>
            {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Transfer ID</Label>
                  <p className="font-semibold">#{selectedTransfer.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedTransfer.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-semibold">{selectedTransfer.product_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-semibold">{selectedTransfer.quantity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">From Shop</Label>
                  <p className="font-semibold">{selectedTransfer.from_shop_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">To Shop</Label>
                  <p className="font-semibold">{selectedTransfer.to_shop_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-semibold">{selectedTransfer.requested_by_username}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested At</Label>
                  <p className="font-semibold">{formatDate(selectedTransfer.requested_at)}</p>
                </div>
                {selectedTransfer.approved_by_username && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Approved By</Label>
                      <p className="font-semibold">{selectedTransfer.approved_by_username}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Approved At</Label>
                      <p className="font-semibold">{formatDate(selectedTransfer.approved_at)}</p>
                    </div>
                  </>
                )}
                {selectedTransfer.completed_at && (
                  <div>
                    <Label className="text-muted-foreground">Completed At</Label>
                    <p className="font-semibold">{formatDate(selectedTransfer.completed_at)}</p>
                  </div>
                )}
              </div>
              {selectedTransfer.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
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

        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' && 'Approve Transfer'}
                {actionType === 'reject' && 'Reject Transfer'}
                {actionType === 'complete' && 'Complete Transfer'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' && 'Are you sure you want to approve this transfer request?'}
                {actionType === 'reject' && 'Are you sure you want to reject this transfer request?'}
                {actionType === 'complete' && 'This will update stock in both shops. Are you sure?'}
              </DialogDescription>
            </DialogHeader>
            {selectedTransfer && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm">
                    <span className="font-semibold">{selectedTransfer.quantity}x</span>{' '}
                    {selectedTransfer.product_name} from {selectedTransfer.from_shop_name} to {selectedTransfer.to_shop_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add any notes about this action..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsActionDialogOpen(false)
                  setActionType(null)
                  setActionNotes('')
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={processing}
                className={
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  actionType === 'complete' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-green-600 hover:bg-green-700'
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === 'approve' && 'Approve'}
                    {actionType === 'reject' && 'Reject'}
                    {actionType === 'complete' && 'Complete'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

