'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAcceptInviteMutation } from '@/lib/api/authApi'
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AcceptInvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [acceptInvite, { isLoading }] = useAcceptInviteMutation()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link. Please request a new invitation.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid invite link')
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      const result = await acceptInvite({
        token,
        password: formData.password,
      }).unwrap()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err: any) {
      setError(
        err.data?.message ||
        err.data?.error ||
        'Failed to accept invitation. The link may have expired.'
      )
    }
  }

  if (!token) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Invalid Invite Link
              </CardTitle>
              <CardDescription>
                This invite link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>
              Set up your account by creating a password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Account Activated!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your account has been successfully set up. Redirecting to dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Setting up account...' : 'Accept Invitation & Set Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

