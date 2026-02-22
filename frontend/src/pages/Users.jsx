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
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    role: 'staff',
    phone: '',
    shop: '',
    is_active: true,
  })
  const [formLoading, setFormLoading] = useState(false)
  const [filterRole, setFilterRole] = useState('all')
  const [filterActive, setFilterActive] = useState('all')

  // Fetch data
  useEffect(() => {
    fetchShops()
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterActive])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let url = '/auth/users/'
      const params = new URLSearchParams()
      
      if (filterRole !== 'all') {
        params.append('role', filterRole)
      }
      if (filterActive !== 'all') {
        params.append('is_active', filterActive)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await api.get(url)
      setUsers(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch users'))
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

  // Handle role select change
  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value,
    })
  }

  // Handle shop select change
  const handleShopChange = (value) => {
    setFormData({
      ...formData,
      shop: value,
    })
  }

  // Open create dialog
  const handleCreate = () => {
    setSelectedUser(null)
    setFormData({
      role: 'staff',
      phone: '',
      shop: 'none',
      is_active: true,
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = async (user) => {
    // Fetch full user details to ensure we have all fields
    try {
      const response = await api.get(`/auth/users/${user.id}/`)
      const fullUser = response.data
      
      // Ensure shop is properly handled (null becomes 'none' for Select component)
      const shopValue = fullUser.shop !== null && fullUser.shop !== undefined 
        ? fullUser.shop.toString() 
        : 'none'
      
      // Set form data first
      const newFormData = {
        role: fullUser.role || 'staff',
        phone: fullUser.phone || '',
        shop: shopValue,
        is_active: fullUser.is_active !== undefined ? fullUser.is_active : true,
      }
      
      setFormData(newFormData)
      setSelectedUser(fullUser)
      setIsDialogOpen(true)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to load user details'))
      // Fallback to using the user object from the list
      const shopValue = user.shop !== null && user.shop !== undefined 
        ? user.shop.toString() 
        : 'none'
      
      const newFormData = {
        role: user.role || 'staff',
        phone: user.phone || '',
        shop: shopValue,
        is_active: user.is_active !== undefined ? user.is_active : true,
      }
      
      setFormData(newFormData)
      setSelectedUser(user)
      setIsDialogOpen(true)
    }
  }

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const submitData = {
        role: formData.role,
        phone: formData.phone || '',
        shop: formData.shop && formData.shop !== 'none' ? parseInt(formData.shop) : null,
        is_active: formData.is_active,
      }

      if (selectedUser) {
        // Update existing user
        await api.put(`/auth/users/${selectedUser.id}/`, submitData)
        toast.success('User updated successfully!')
      } else {
        // Create new user - this would need username, email, password
        toast.error('Please use the registration page to create new users, or implement create user API')
        return
      }
      
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Operation failed'))
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedUser) return

    // Prevent deleting own account
    if (selectedUser.id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      setIsDeleteDialogOpen(false)
      return
    }

    try {
      setFormLoading(true)
      await api.delete(`/auth/users/${selectedUser.id}/`)
      toast.success('User deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to delete user'))
    } finally {
      setFormLoading(false)
    }
  }

  // Open delete confirmation
  const confirmDelete = (user) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'sales_manager':
        return 'bg-blue-100 text-blue-800'
      case 'staff':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">User Management</h1>
            <p className="body-small text-muted-foreground mt-1">Manage users and permissions</p>
          </div>
          <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </header>

        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage users, assign roles, and assign shops to sales managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="filter-role">Role</Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger id="filter-role">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="filter-active">Status</Label>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger id="filter-active">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.username}
                          {user.id === currentUser?.id && (
                            <Shield className="w-4 h-4 text-purple-500" title="Current User" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'sales_manager' ? 'Sales Manager' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{user.shop_name || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(user)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? 'Update user information below. You can assign a shop to sales managers.'
                : 'Note: To create a new user, please use the registration page. This dialog is for editing existing users.'}
            </DialogDescription>
          </DialogHeader>
          {selectedUser ? (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={selectedUser.username}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={selectedUser.email}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shop">Shop</Label>
                  <Select
                    value={formData.shop}
                    onValueChange={handleShopChange}
                  >
                    <SelectTrigger id="shop">
                      <SelectValue placeholder="No shop assigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No shop assigned</SelectItem>
                      {shops.map((shop) => (
                        <SelectItem key={shop.id} value={shop.id.toString()}>
                          {shop.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Assign a shop to sales managers</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active Account
                  </Label>
                </div>
                {selectedUser.id === currentUser?.id && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ You cannot deactivate your own account
                  </p>
                )}
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
                  {formLoading ? 'Saving...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="py-4">
              <p className="text-gray-600 mb-4">
                To create a new user, please use the registration page at <code className="bg-gray-100 px-2 py-1 rounded">/register</code>
              </p>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{selectedUser?.username}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
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
    </AppLayout>
  )
}

