import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatError } from '@/utils/errorFormatter'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    role: 'staff',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.password2) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    const result = await register(formData)
    
    if (result.success) {
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } else {
      const errorMessage = formatError(result.error)
      toast.error(errorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <Card className="w-full max-w-md shadow-large glass-effect border-0 relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-glow transform transition-transform duration-300 hover:scale-105">
            <span className="text-4xl font-bold text-white">S</span>
          </div>
          <CardTitle className="heading-2 text-gray-900">Create Account</CardTitle>
          <CardDescription className="body-medium text-muted-foreground mt-2">
            Sign up for Supermarket Sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="username" className="label-text">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="email" className="label-text">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="password" className="label-text">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Label htmlFor="password2" className="label-text">Confirm Password</Label>
              <Input
                id="password2"
                name="password2"
                type="password"
                placeholder="Confirm your password"
                value={formData.password2}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <Label htmlFor="role" className="label-text">Role</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                disabled={loading}
              >
                <option value="staff">Staff</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Label htmlFor="phone" className="label-text">Phone (Optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-200 shadow-medium hover:shadow-large transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pt-6">
          <p className="body-small text-center text-muted-foreground">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

