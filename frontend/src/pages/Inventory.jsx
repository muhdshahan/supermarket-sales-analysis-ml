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
import { Plus, Pencil, Trash2, Warehouse, AlertTriangle } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Inventory() {
  const { user } = useAuth()
  const { checkForNewAlerts } = useAlerts()
  const [stocks, setStocks] = useState([])
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [formData, setFormData] = useState({
    shop: '',
    product: '',
    quantity: '',
    min_threshold: '',
    max_capacity: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [filterShop, setFilterShop] = useState('all')
  const [filterLowStock, setFilterLowStock] = useState('all')

  const isAdmin = user?.role === 'admin'
  const isSalesManager = user?.role === 'sales_manager'
  const canEdit = isAdmin || isSalesManager

  // Fetch data
  useEffect(() => {
    fetchShops()
    fetchProducts()
    fetchStocks()
  }, [filterShop, filterLowStock])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/')
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchStocks = async () => {
    try {
      setLoading(true)
      let url = '/inventory/stock/'
      const params = new URLSearchParams()
      
      if (filterShop !== 'all') {
        params.append('shop_id', filterShop)
      }
      if (filterLowStock === 'true') {
        params.append('low_stock', 'true')
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await api.get(url)
      setStocks(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch stock'))
    } finally {
      setLoading(false)
    }
  }

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle shop select change
  const handleShopChange = (value) => {
    setFormData({
      ...formData,
      shop: value,
    })
  }

  // Handle product select change
  const handleProductChange = (value) => {
    setFormData({
      ...formData,
      product: value,
    })
  }

  // Open create dialog
  const handleCreate = () => {
    setSelectedStock(null)
    setFormData({
      shop: user?.shop?.id?.toString() || '',
      product: '',
      quantity: '',
      min_threshold: '',
      max_capacity: '',
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (stock) => {
    setSelectedStock(stock)
    setFormData({
      shop: stock.shop.toString(),
      product: stock.product.toString(),
      quantity: stock.quantity.toString(),
      min_threshold: stock.min_threshold.toString(),
      max_capacity: stock.max_capacity || '',
    })
    setIsDialogOpen(true)
  }

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const submitData = {
        shop: parseInt(formData.shop),
        product: parseInt(formData.product),
        quantity: parseInt(formData.quantity) || 0,
        min_threshold: parseInt(formData.min_threshold) || 0,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
      }

      if (selectedStock) {
        // Update existing stock
        await api.put(`/inventory/stock/${selectedStock.id}/`, submitData)
        toast.success('Stock updated successfully!')
      } else {
        // Create new stock
        await api.post('/inventory/stock/', submitData)
        toast.success('Stock record created successfully!')
      }
      
      setIsDialogOpen(false)
      fetchStocks()
      
      // Check for new alerts after stock update
      setTimeout(() => {
        checkForNewAlerts(true)
      }, 1000)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Operation failed'))
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStock) return

    try {
      setFormLoading(true)
      await api.delete(`/inventory/stock/${selectedStock.id}/`)
      toast.success('Stock record deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedStock(null)
      fetchStocks()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to delete stock'))
    } finally {
      setFormLoading(false)
    }
  }

  // Open delete confirmation
  const confirmDelete = (stock) => {
    setSelectedStock(stock)
    setIsDeleteDialogOpen(true)
  }

  // Get available shops for sales manager (only their shop)
  const availableShops = isSalesManager && user?.shop
    ? shops.filter(s => s.id === user.shop.id)
    : shops

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">Inventory Management</h1>
            <p className="body-small text-muted-foreground mt-1">Manage inventory levels for products across shops</p>
          </div>
          {canEdit && (
            <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Stock
            </Button>
          )}
        </div>
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="filter-shop">Shop</Label>
                <Select value={filterShop} onValueChange={setFilterShop}>
                  <SelectTrigger id="filter-shop">
                    <SelectValue placeholder="All Shops" />
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
              <div className="flex-1">
                <Label htmlFor="filter-low-stock">Stock Status</Label>
                <Select value={filterLowStock} onValueChange={setFilterLowStock}>
                  <SelectTrigger id="filter-low-stock">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading stock...</p>
              </div>
            ) : stocks.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No stock records found</p>
                {canEdit && (
                  <Button onClick={handleCreate} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Stock Record
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Max Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{stock.product_name}</div>
                          <div className="text-xs text-gray-500">₹{parseFloat(stock.product_price).toFixed(2)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{stock.shop_name}</TableCell>
                      <TableCell>{stock.category_name || '-'}</TableCell>
                      <TableCell className="font-semibold">{stock.quantity}</TableCell>
                      <TableCell>{stock.min_threshold}</TableCell>
                      <TableCell>{stock.max_capacity || '-'}</TableCell>
                      <TableCell>
                        {stock.is_out_of_stock ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Out of Stock
                          </span>
                        ) : stock.is_low_stock ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(stock)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(stock)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStock ? 'Edit Stock' : 'Create New Stock Record'}
            </DialogTitle>
            <DialogDescription>
              {selectedStock
                ? 'Update stock information below.'
                : 'Fill in the details to create a new stock record.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shop">Shop *</Label>
                <Select
                  value={formData.shop}
                  onValueChange={handleShopChange}
                  disabled={isSalesManager && user?.shop}
                >
                  <SelectTrigger id="shop">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.product}
                  onValueChange={handleProductChange}
                  disabled={!!selectedStock}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} - ₹{parseFloat(product.unit_price).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="min_threshold">Minimum Threshold *</Label>
                <Input
                  id="min_threshold"
                  name="min_threshold"
                  type="number"
                  min="0"
                  value={formData.min_threshold}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_capacity">Maximum Capacity</Label>
                <Input
                  id="max_capacity"
                  name="max_capacity"
                  type="number"
                  min="0"
                  value={formData.max_capacity}
                  onChange={handleChange}
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-500">Maximum storage capacity (optional)</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : selectedStock ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the stock record for "{selectedStock?.product_name}" at "{selectedStock?.shop_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedStock(null)
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}




