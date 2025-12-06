import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import StoreProvider from '@/components/providers/StoreProvider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { config } from '@/config'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Minimal Project Management System',
  description: 'A project management system with admin dashboard and user panel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <StoreProvider>
          {config.oauth.google.clientId ? (
            <GoogleOAuthProvider clientId={config.oauth.google.clientId}>
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">{children}</main>
              </div>
            </GoogleOAuthProvider>
          ) : (
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">{children}</main>
            </div>
          )}
        </StoreProvider>
      </body>
    </html>
  )
}
