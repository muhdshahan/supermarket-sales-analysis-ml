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
import { Plus, Minus, Trash2, ShoppingCart, Receipt } from 'lucide-react'
import AppLayout from '@/components/AppLayout'

export default function Billing() {
  const { user, refreshUser } = useAuth()
  const { checkForNewAlerts } = useAlerts()
  const [products, setProducts] = useState([])
  const [shops, setShops] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedShop, setSelectedShop] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      // Refresh user data first to get latest shop assignment
      if (user) {
        await refreshUser()
      }
      await Promise.all([
        fetchShops(),
        fetchProducts(),
        fetchCategories()
      ])
    }
    loadData()
  }, [])

  // Set default shop for staff/sales_manager after shops are loaded
  useEffect(() => {
    if (shops.length === 0 || selectedShop) return

    // user.shop can be either an ID (number) or an object with id property
    // Handle both cases: shop as object {id: 1} or shop as number 1
    let shopId = null
    if (user?.shop) {
      if (typeof user.shop === 'object' && user.shop !== null && user.shop.id) {
        shopId = user.shop.id
      } else if (typeof user.shop === 'number') {
        shopId = user.shop
      }
    }

    if (shopId) {
      // Make sure the shop exists in the shops list
      const shopExists = shops.some(s => s.id === shopId)
      if (shopExists) {
        setSelectedShop(shopId.toString())
      }
    }
  }, [user, shops, selectedShop])

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/')
      setShops(response.data)
      return response.data
    } catch (error) {
      console.error('Failed to fetch shops:', error)
      return []
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products/?is_active=true')
      setProducts(response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || 'Failed to fetch products'))
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/')
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  // Add product to cart
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id)

    if (existingItem) {
      // Increase quantity
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: parseFloat(product.unit_price)
      }])
    }
    toast.success(`${product.name} added to cart`)
  }

  // Update quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId))
    toast.success('Item removed from cart')
  }

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discountAmount = parseFloat(discount) || 0
    const taxAmount = parseFloat(tax) || 0
    return subtotal - discountAmount + taxAmount
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setDiscount('0')
    setTax('0')
    setNotes('')
  }

  // Submit sale
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedShop) {
      toast.error('Please select a shop')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty. Add items to create a sale.')
      return
    }

    setSubmitting(true)

    try {
      const saleData = {
        shop: parseInt(selectedShop),
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price.toString()
        })),
        discount: discount || '0',
        tax: tax || '0',
        payment_method: paymentMethod,
        notes: notes || ''
      }

      const response = await api.post('/sales/', saleData)
      toast.success('Sale created successfully!')

      // Clear cart and reset form
      clearCart()

      // Check for new alerts after sale (small delay to ensure backend processed)
      setTimeout(() => {
        checkForNewAlerts(true)
      }, 1000)

      // Optionally redirect to sale details or show receipt
      console.log('Sale created:', response.data)
    } catch (error) {
      toast.error(formatError(error.response?.data || error.message || 'Failed to create sale'))
    } finally {
      setSubmitting(false)
    }
  }

  // Get available shops (staff/sales_manager see only their shop)
  // user.shop can be either an ID (number) or an object with id property
  const userShopId = typeof user?.shop === 'object' && user?.shop !== null
    ? user.shop.id
    : user?.shop

  const availableShops = (user?.role === 'staff' || user?.role === 'sales_manager') && userShopId
    ? shops.filter(s => s.id === userShopId)
    : shops

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === parseInt(selectedCategory))

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="heading-2 text-gray-900">Billing</h1>
            <p className="body-small text-muted-foreground mt-1">Create sales and bills</p>
          </div>
          {cart.length > 0 && (
            <Button variant="outline" onClick={clearCart} className="border-2 hover:bg-destructive/5 hover:border-destructive hover:text-destructive">
              Clear Cart
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3 text-center sm:text-left">
                <CardTitle>Products</CardTitle>
                <CardDescription>Select products to add to cart</CardDescription>

                {/* Category Filter Chips */}
                {!loading && categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pb-2 -mx-1 px-1 overflow-x-auto no-scrollbar">
                    <Button
                      key="all"
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                      className={`rounded-full h-8 px-4 transition-all ${selectedCategory === 'all' ? 'shadow-glow' : ''}`}
                    >
                      All
                    </Button>
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id.toString())}
                        className={`rounded-full h-8 px-4 transition-all ${selectedCategory === category.id.toString() ? 'shadow-glow' : ''}`}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No products found</p>
                    <p className="text-sm text-gray-400">Try selecting a different category</p>
                    {selectedCategory !== 'all' && (
                      <Button
                        variant="link"
                        onClick={() => setSelectedCategory('all')}
                        className="mt-2 text-primary"
                      >
                        Clear filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="group cursor-pointer hover:shadow-lg transition-all border-0 shadow-soft animate-fade-in relative overflow-hidden"
                        onClick={() => addToCart(product)}
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-primary/10 text-primary p-1 rounded-full">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                                {product.category_name || 'No category'}
                              </p>
                              <div className="flex items-baseline gap-1 mt-3">
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{parseFloat(product.unit_price).toLocaleString('en-IN')}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">/ unit</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Cart
                </CardTitle>
                <CardDescription>
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cart is empty</p>
                    <p className="text-sm text-gray-400 mt-2">Add products to get started</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Shop Selection */}
                    <div className="grid gap-2">
                      <Label htmlFor="shop">Shop *</Label>
                      <Select
                        value={selectedShop}
                        onValueChange={setSelectedShop}
                        disabled={user?.role === 'staff' || user?.role === 'sales_manager'}
                      >
                        <SelectTrigger id="shop">
                          <SelectValue placeholder="Select shop" />
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

                    {/* Cart Items */}
                    <div className="border rounded-lg p-2 max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8">Item</TableHead>
                            <TableHead className="h-8 text-right">Qty</TableHead>
                            <TableHead className="h-8 text-right">Price</TableHead>
                            <TableHead className="h-8 text-right">Total</TableHead>
                            <TableHead className="h-8 w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((item) => {
                            const itemTotal = item.quantity * item.unit_price
                            return (
                              <TableRow key={item.product.id}>
                                <TableCell className="font-medium text-sm">
                                  {item.product.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  ₹{item.unit_price.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₹{itemTotal.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600"
                                    onClick={() => removeFromCart(item.product.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <Label htmlFor="discount" className="text-sm">Discount:</Label>
                        <Input
                          id="discount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-24 h-8 text-right"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Label htmlFor="tax" className="text-sm">Tax:</Label>
                        <Input
                          id="tax"
                          type="number"
                          min="0"
                          step="0.01"
                          value={tax}
                          onChange={(e) => setTax(e.target.value)}
                          className="w-24 h-8 text-right"
                        />
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="grid gap-2">
                      <Label htmlFor="payment_method">Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment_method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Processing...' : `Complete Sale - ₹${calculateTotal().toFixed(2)}`}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}