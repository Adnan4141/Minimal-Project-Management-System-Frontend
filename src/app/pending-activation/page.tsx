'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, LogOut } from 'lucide-react'

function PendingActivationContent() {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingReason, setPendingReason] = useState<string | null>(null)

  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason) {
      setPendingReason(decodeURIComponent(reason))
    }
  }, [searchParams])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user?.isActive === true) {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, user?.isActive, router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.isActive === true) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shadow-md">
              <AlertCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            Account Pending Activation
          </CardTitle>
          <CardDescription className="text-lg mt-4 text-yellow-800 dark:text-yellow-200">
            Your account is currently inactive and pending activation by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {pendingReason && (
            <div className="rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 p-4">
              <p className="text-base font-medium text-yellow-900 dark:text-yellow-100">
                {pendingReason}
              </p>
            </div>
          )}
          <p className="text-base text-yellow-700 dark:text-yellow-300 leading-relaxed">
            Please contact your administrator to activate your account. Once activated, you will be able to access all features of the system.
          </p>
          <div className="pt-6 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-6">
              If you believe this is an error, please reach out to your system administrator.
            </p>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PendingActivationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PendingActivationContent />
    </Suspense>
  )
}

