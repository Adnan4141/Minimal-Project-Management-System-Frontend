'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const [sidebarWidth, setSidebarWidth] = useState(256) // 64 * 4 = 256px (w-64)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const handleStorageChange = () => {
      const isExpanded = localStorage.getItem('sidebarExpanded') === 'true'
      setSidebarWidth(isExpanded ? 256 : 80) // 64 * 4 = 256px or 20 * 4 = 80px
    }


    handleStorageChange()


    window.addEventListener('storage', handleStorageChange)
    

    window.addEventListener('sidebarToggle', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarToggle', handleStorageChange)
    }
  }, [])

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

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {user && user.isActive === false ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
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
                  <p className="text-base text-yellow-700 dark:text-yellow-300 leading-relaxed">
                    Please contact your administrator to activate your account. Once activated, you will be able to access all features of the system.
                  </p>
                  <div className="pt-6 border-t border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      If you believe this is an error, please reach out to your system administrator.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}

