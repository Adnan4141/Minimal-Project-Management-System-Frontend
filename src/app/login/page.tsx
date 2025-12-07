'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOAuthMutation } from '@/lib/api/authApi'
import { useAppDispatch } from '@/lib/hooks'
import { setCredentials } from '@/lib/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { FolderKanban } from 'lucide-react'
import { config } from '@/config'

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { login, isLoading, isAuthenticated } = useAuth()
  const [oauth, { isLoading: isOAuthLoading }] = useOAuthMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pendingMessage, setPendingMessage] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('pending') === 'true') {
      setPendingMessage('Registration successful! Your account is pending activation by an administrator.')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])
  

  const handleOAuthSuccess = async (provider: 'google' | 'facebook', token: string) => {
    try {
      setError('')
      const result = await oauth({
        provider,
        ...(provider === 'google' ? { idToken: token } : { accessToken: token }),
      }).unwrap()

  
  

      if (result.success && result.data) {
        dispatch(setCredentials(result.data))
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.data?.message || `${provider} login failed`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    const result = await login(email, password)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <FolderKanban className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {pendingMessage && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                {pendingMessage}
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
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
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
