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
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [formLoading, setFormLoading] = useState(false)

  const isAdmin = user?.role === 'admin'

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products/categories/')
      setCategories(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch categories'))
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

  // Open create dialog
  const handleCreate = () => {
    setSelectedCategory(null)
    setFormData({
      name: '',
      description: '',
    })
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleEdit = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setIsDialogOpen(true)
  }

  // Handle form submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (selectedCategory) {
        // Update existing category
        await api.put(`/products/categories/${selectedCategory.id}/`, formData)
        toast.success('Category updated successfully!')
      } else {
        // Create new category
        await api.post('/products/categories/', formData)
        toast.success('Category created successfully!')
      }
      
      setIsDialogOpen(false)
      fetchCategories()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Operation failed'))
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      setFormLoading(true)
      await api.delete(`/products/categories/${selectedCategory.id}/`)
      toast.success('Category deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to delete category'))
    } finally {
      setFormLoading(false)
    }
  }

  // Open delete confirmation
  const confirmDelete = (category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">Categories Management</h1>
            <p className="body-small text-muted-foreground mt-1">Manage product categories (Dairy, Bakery, etc.)</p>
          </div>
          {isAdmin && (
            <Button onClick={handleCreate} className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          )}
        </div>
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No categories found</p>
                {isAdmin && (
                  <Button onClick={handleCreate} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Category
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(category)}
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
              {selectedCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Update category information below.'
                : 'Fill in the details to create a new category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Dairy, Bakery, Beverages"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional description for this category"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
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
                {formLoading ? 'Saving...' : selectedCategory ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
              {selectedCategory && ' If this category has products, you will need to reassign them first.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedCategory(null)
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

