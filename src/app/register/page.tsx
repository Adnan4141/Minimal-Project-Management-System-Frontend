'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOAuthMutation, useGetMeQuery } from '@/lib/api/authApi'
import { useAppDispatch } from '@/lib/hooks'
import { setCredentials } from '@/lib/slices/authSlice'
import { apiSlice } from '@/lib/api/apiSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { FolderKanban } from 'lucide-react'
import { config } from '@/config'

export default function RegisterPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { register, isLoading, isAuthenticated, user } = useAuth()
  const [oauth, { isLoading: isOAuthLoading }] = useOAuthMutation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')


  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isAuthenticated && user) {
    return null
  }


  const { refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: true,
  })

  const handleOAuthSuccess = async (provider: 'google' | 'facebook', token: string) => {
    try {
      setError('')
      
      dispatch(apiSlice.util.invalidateTags(['User']))
      dispatch(apiSlice.util.resetApiState())
      
      const result = await oauth({
        provider,
        ...(provider === 'google' ? { idToken: token } : { accessToken: token }),
      }).unwrap()

      if (result.success && result.data) {
        dispatch(setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
        }))
        
        setTimeout(() => {
          refetchMe()
          router.push('/dashboard')
        }, 100)
      }
    } catch (err: any) {
      if (err.data?.requiresActivation) {
        setError(err.data?.message || 'Your account is pending activation. Please contact an administrator to activate your account.')
      } else {
        setError(err.data?.message || `${provider} registration failed`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    })

    if (result.success) {
      router.push('/login?pending=true')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <FolderKanban className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            
            {(config.oauth.google.clientId || config.oauth.facebook.appId) && (
              <>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <OAuthButtons
                  onSuccess={handleOAuthSuccess}
                  onError={(error) => setError(error)}
                  disabled={isLoading || isOAuthLoading}
                />
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
