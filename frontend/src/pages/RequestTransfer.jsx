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
import { ArrowRight, Package } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function RequestTransfer() {
  const { user } = useAuth()
  const [shops, setShops] = useState([])
  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    from_shop: '',
    to_shop: '',
    product: '',
    quantity: '',
    notes: '',
  })
  const [availableStock, setAvailableStock] = useState(0)

  // Fetch data
  useEffect(() => {
    fetchShops()
    fetchProducts()
  }, [])

  // Set default from_shop for sales_manager
  useEffect(() => {
    if (user?.role === 'sales_manager' && user?.shop && shops.length > 0) {
      // Handle shop as object or ID
      let shopId = null
      if (typeof user.shop === 'object' && user.shop !== null && user.shop.id) {
        shopId = user.shop.id
      } else if (typeof user.shop === 'number') {
        shopId = user.shop
      }
      
      if (shopId) {
        const shopExists = shops.some(s => s.id === shopId)
        if (shopExists && !formData.from_shop) {
          setFormData(prev => ({ ...prev, from_shop: shopId.toString() }))
        }
      }
    }
  }, [user, shops])

  // Fetch stock when from_shop and product are selected
  useEffect(() => {
    if (formData.from_shop && formData.product) {
      fetchStock(formData.from_shop, formData.product)
    } else {
      setAvailableStock(0)
    }
  }, [formData.from_shop, formData.product])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
    } catch (error) {
      console.error('Failed to fetch shops:', error)
      toast.error('Failed to load shops')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/')
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast.error('Failed to load products')
    }
  }

  const fetchStock = async (shopId, productId) => {
    try {
      const response = await api.get(`/inventory/stock/?shop_id=${shopId}&product_id=${productId}`)
      if (response.data.length > 0) {
        setAvailableStock(response.data[0].quantity)
      } else {
        setAvailableStock(0)
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error)
      setAvailableStock(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.from_shop || !formData.to_shop || !formData.product || !formData.quantity) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.from_shop === formData.to_shop) {
      toast.error('Cannot transfer to the same shop')
      return
    }

    if (parseInt(formData.quantity) < 1) {
      toast.error('Quantity must be at least 1')
      return
    }

    if (parseInt(formData.quantity) > availableStock) {
      toast.error(`Insufficient stock. Available: ${availableStock}`)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        from_shop: parseInt(formData.from_shop),
        to_shop: parseInt(formData.to_shop),
        product: parseInt(formData.product),
        quantity: parseInt(formData.quantity),
        notes: formData.notes,
      }

      await api.post('/transfers/', payload)
      toast.success('Transfer request created successfully')
      
      // Reset form
      setFormData({
        from_shop: user?.role === 'sales_manager' && user?.shop ? 
          (typeof user.shop === 'object' ? user.shop.id : user.shop).toString() : '',
        to_shop: '',
        product: '',
        quantity: '',
        notes: '',
      })
      setAvailableStock(0)
    } catch (error) {
      toast.error(formatError(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Reset product and quantity when shop changes
    if (field === 'from_shop' || field === 'to_shop') {
      setFormData(prev => ({ ...prev, product: '', quantity: '' }))
      setAvailableStock(0)
    }
    // Reset quantity when product changes
    if (field === 'product') {
      setFormData(prev => ({ ...prev, quantity: '' }))
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const fromShopName = shops.find(s => s.id === parseInt(formData.from_shop))?.name || ''
  const toShopName = shops.find(s => s.id === parseInt(formData.to_shop))?.name || ''
  const productName = products.find(p => p.id === parseInt(formData.product))?.name || ''

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="heading-2 text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Request Stock Transfer
          </h1>
          <p className="body-small text-muted-foreground mt-1">Request to transfer stock from one shop to another</p>
        </div>
        <Card className="border-0 shadow-soft">
          <CardContent className="pt-6">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* From Shop */}
            <div className="space-y-2">
              <Label htmlFor="from_shop">From Shop *</Label>
              <Select
                value={formData.from_shop}
                onValueChange={(value) => handleChange('from_shop', value)}
                disabled={user?.role === 'sales_manager'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id.toString()}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user?.role === 'sales_manager' && (
                <p className="text-sm text-muted-foreground">
                  Your assigned shop: {fromShopName}
                </p>
              )}
            </div>

            {/* To Shop */}
            <div className="space-y-2">
              <Label htmlFor="to_shop">To Shop *</Label>
              <Select
                value={formData.to_shop}
                onValueChange={(value) => handleChange('to_shop', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops
                    .filter(shop => shop.id !== parseInt(formData.from_shop))
                    .map((shop) => (
                      <SelectItem key={shop.id} value={shop.id.toString()}>
                        {shop.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Select
                value={formData.product}
                onValueChange={(value) => handleChange('product', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {product.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.from_shop && formData.product && (
                <p className="text-sm text-muted-foreground">
                  Available stock: <span className="font-semibold">{availableStock}</span>
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="Enter quantity"
              />
              {formData.quantity && parseInt(formData.quantity) > availableStock && (
                <p className="text-sm text-destructive">
                  Insufficient stock. Available: {availableStock}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any notes about this transfer request..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Summary */}
            {formData.from_shop && formData.to_shop && formData.product && formData.quantity && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Transfer Summary</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{formData.quantity}x</span>
                      <span>{productName}</span>
                      <ArrowRight className="h-4 w-4 mx-2" />
                      <span className="font-medium">{fromShopName}</span>
                      <ArrowRight className="h-4 w-4 mx-2" />
                      <span className="font-medium">{toShopName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Request Transfer'}
            </Button>
          </form>
        </CardContent>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

