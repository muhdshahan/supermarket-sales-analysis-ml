import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatError } from '@/utils/errorFormatter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Shops() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    is_active: true,
  })
  const [formLoading, setFormLoading] = useState(false)

  const isAdmin = user?.role === 'admin'

  // Fetch shops
  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch shops'))
    } finally {
      setLoading(false)
    }
  }

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  // Open create dialog
  const handleCreate = () => {
    setSelectedShop(null)
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (shop) => {
    setSelectedShop(shop)
    setFormData({
      name: shop.name,
      address: shop.address,
      phone: shop.phone || '',
      email: shop.email || '',
      is_active: shop.is_active,
    })
    setIsDialogOpen(true)
  }

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (selectedShop) {
        // Update existing shop
        await api.put(`/shops/${selectedShop.id}/`, formData)
        toast.success('Shop updated successfully!')
      } else {
        // Create new shop
        await api.post('/shops/', formData)
        toast.success('Shop created successfully!')
      }
      
      setIsDialogOpen(false)
      fetchShops()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Operation failed'))
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedShop) return

    try {
      setFormLoading(true)
      await api.delete(`/shops/${selectedShop.id}/`)
      toast.success('Shop deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedShop(null)
      fetchShops()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to delete shop'))
    } finally {
      setFormLoading(false)
    }
  }

  // Open delete confirmation
  const confirmDelete = (shop) => {
    setSelectedShop(shop)
    setIsDeleteDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">Shops Management</h1>
            <p className="body-small text-muted-foreground mt-1">Manage your supermarket shops and branches</p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Shop
            </Button>
          )}
        </div>
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading shops...</p>
              </div>
            ) : shops.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No shops found</p>
                {isAdmin && (
                  <Button onClick={handleCreate} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Shop
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.name}</TableCell>
                      <TableCell>{shop.address}</TableCell>
                      <TableCell>{shop.phone || '-'}</TableCell>
                      <TableCell>{shop.email || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            shop.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {shop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(shop)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(shop)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedShop ? 'Edit Shop' : 'Create New Shop'}
            </DialogTitle>
            <DialogDescription>
              {selectedShop
                ? 'Update shop information below.'
                : 'Fill in the details to create a new shop.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Shop Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Main Store"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Shop address"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="1234567890"
                  type="tel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="shop@example.com"
                  type="email"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Active
                </Label>
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
                {formLoading ? 'Saving...' : selectedShop ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedShop?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedShop(null)
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

