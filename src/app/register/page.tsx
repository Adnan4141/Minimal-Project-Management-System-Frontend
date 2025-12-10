'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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


const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { register, isLoading, isAuthenticated, user } = useAuth()
  const [oauth, { isLoading: isOAuthLoading }] = useOAuthMutation()
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })

  const { refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: true,
  })

  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, user, router])

  if (isAuthenticated && user) {
    return null
  }

  const handleOAuthSuccess = async (provider: 'google' | 'facebook', token: string) => {
    try {
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
        setFormError('root', {
          message: err.data?.message || 'Your account is pending activation. Please contact an administrator to activate your account.'
        })
      } else {
        setFormError('root', {
          message: err.data?.message || `${provider} registration failed`
        })
      }
    }
  }

  const onSubmit = async (data: RegisterFormData) => {
    const result = await register({
      name: data.name,
      email: data.email,
      password: data.password,
    })

    if (result.success) {
      router.push('/login?pending=true')
    } else {
      setFormError('root', {
        message: result.error || 'Registration failed'
      })
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errors.root.message}
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
                {...registerField('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...registerField('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                {...registerField('password')}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...registerField('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
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
                  onError={(error) => setFormError('root', { message: error })}
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
