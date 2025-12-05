import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'


const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Your Starter Project',
  description: 'A fresh starter pack for your application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>      
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">{children}</main>
          </div>
  
      </body>
    </html>
  )
}
