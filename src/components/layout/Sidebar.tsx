'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  BarChart3,
  CheckSquare,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/tasks/kanban', label: 'Kanban Board', icon: FileText },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
]

const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-projects', label: 'My Projects', icon: FolderKanban },
  { href: '/my-tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/time-log', label: 'Time Log', icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdminOrManager } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarExpanded')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarExpanded', String(isExpanded))

      window.dispatchEvent(new Event('sidebarToggle'))
    }
  }, [isExpanded])

  const navItems = user?.isActive === false ? [] : (isAdminOrManager ? adminNavItems : userNavItems)

  return (
    <>
      
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        <div className="flex h-full flex-col">
          
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link 
              href="/dashboard" 
              className={cn(
                "flex items-center gap-2 transition-opacity",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              <FolderKanban className="h-6 w-6 text-primary shrink-0" />
              <span className="text-xl font-bold whitespace-nowrap">MPMS</span>
            </Link>
            {isExpanded && (
              <FolderKanban className="h-6 w-6 text-primary lg:hidden" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !isExpanded && "justify-center"
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "whitespace-nowrap transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  )}>
                    {item.label}
                  </span>
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          
          <div className="border-t p-4">
            <div className={cn(
              "mb-3 flex items-center gap-3 px-3 transition-all",
              !isExpanded && "justify-center"
            )}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="h-10 w-10 rounded-full object-cover shrink-0 border-2 border-primary/20"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0 border-2 border-primary/20">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className={cn(
                "flex-1 min-w-0 transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}>
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Link
              href="/profile"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-2",
                pathname === '/profile'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !isExpanded && "justify-center px-0"
              )}
              title={!isExpanded ? "Profile" : undefined}
            >
              <User className={cn("h-4 w-4 shrink-0", isExpanded && "mr-2")} />
              {isExpanded && <span>Profile</span>}
            </Link>
            <Button
              variant="ghost"
              className={cn(
                "w-full transition-all",
                isExpanded ? "justify-start" : "justify-center px-0"
              )}
              onClick={() => {
                logout()
                setIsMobileOpen(false)
              }}
              title={!isExpanded ? "Logout" : undefined}
            >
              <LogOut className={cn("h-4 w-4 shrink-0", isExpanded && "mr-2")} />
              {isExpanded && <span>Logout</span>}
            </Button>
          </div>
        </div>

        
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </aside>
    </>
  )
}

