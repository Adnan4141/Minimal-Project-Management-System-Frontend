'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetUsersQuery, useActivateUserMutation, useDeactivateUserMutation, useUpdateUserMutation } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Users, Mail, Building2, Briefcase, ExternalLink, CheckCircle2, UserCheck, UserX, Shield, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function TeamsPage() {
  const { isAdminOrManager, user: currentUser } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data, isLoading, refetch } = useGetUsersQuery({ 
    page: 1, 
    limit: 50,
    isActive: statusFilter !== 'all' ? statusFilter : undefined,
  })
  const [activateUser, { isLoading: isActivating }] = useActivateUserMutation()
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [actionError, setActionError] = useState('')
  const [actioningUserId, setActioningUserId] = useState<string | null>(null)

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [actionError])

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const allUsers = data?.data?.users || []

  const groupedUsers = {
    Admin: allUsers.filter((user: any) => user.role === 'Admin'),
    Manager: allUsers.filter((user: any) => user.role === 'Manager'),
    Member: allUsers.filter((user: any) => user.role === 'Member'),
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800'
      case 'Manager':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Administrators'
      case 'Manager':
        return 'Managers'
      default:
        return 'Team Members'
    }
  }

  const handleActivate = async (userId: string) => {
    setActionError('')
    setActioningUserId(userId)
    try {
      await activateUser(userId).unwrap()
      refetch()
    } catch (error: any) {
      setActionError(error?.data?.message || 'Failed to activate user')
    } finally {
      setActioningUserId(null)
    }
  }

  const handleDeactivate = async (userId: string) => {
    setActionError('')
    setActioningUserId(userId)
    try {
      await deactivateUser(userId).unwrap()
      refetch()
    } catch (error: any) {
      setActionError(error?.data?.message || 'Failed to deactivate user')
    } finally {
      setActioningUserId(null)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'Admin' | 'Manager' | 'Member') => {
    setActionError('')
    setActioningUserId(userId)
    try {
      await updateUser({
        id: userId,
        role: newRole,
      }).unwrap()
      refetch()
    } catch (error: any) {
      setActionError(error?.data?.message || 'Failed to update role')
    } finally {
      setActioningUserId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <Link href="/teams/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>

        {actionError && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2 text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{actionError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActionError('')}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Pending Activation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : allUsers.length > 0 ? (
          <div className="space-y-8">
            {(['Admin', 'Manager', 'Member'] as const).map((role) => {
              const users = groupedUsers[role]
              if (users.length === 0) return null

              return (
                <div key={role} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <h2 className="text-xl font-semibold text-foreground px-4">
                      {getRoleLabel(role)}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({users.length})
                      </span>
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {users.map((user: any) => (
                      <Card key={user.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden flex flex-col h-full">
                        <CardHeader className="pb-3 flex-shrink-0">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              {user.avatar ? (
                                <div className="relative h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-md group-hover:scale-105">
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                  <div className="avatar-fallback absolute inset-0 h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl font-bold hidden">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl font-bold shadow-md group-hover:scale-105 transition-transform duration-300">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {user.isActive ? (
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                              ) : (
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center">
                                  <AlertCircle className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                {user.name}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1.5 mt-1.5 text-xs">
                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex-1 flex flex-col">
                          <div className="space-y-3 flex-1 flex flex-col">
                            <div className="flex items-center justify-between pt-2 border-t h-10 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">Role</span>
                              </div>
                              {currentUser?.role === 'Admin' && user.id !== currentUser?.id ? (
                                <Select
                                  value={user.role}
                                  onValueChange={(value) => handleRoleChange(user.id, value as 'Admin' | 'Manager' | 'Member')}
                                  disabled={actioningUserId === user.id && isUpdating}
                                >
                                  <SelectTrigger className="h-7 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Member">Member</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge className={`${getRoleColor(user.role)} font-medium px-2.5 py-0.5 flex-shrink-0`}>
                                  {user.role}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="h-6 flex-shrink-0 flex items-center">
                              {user.isActive ? (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm h-6 flex-shrink-0">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground truncate text-xs">
                                {user.department ? (
                                  user.department
                                ) : (
                                  <span className="italic text-muted-foreground/60">No department</span>
                                )}
                              </span>
                            </div>
                            
                            <div className="space-y-2 h-20 flex-shrink-0">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skills</p>
                              <div className="h-12 overflow-hidden">
                                {user.skills && user.skills.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {user.skills.slice(0, 3).map((skill: string, idx: number) => (
                                      <Badge 
                                        key={idx} 
                                        variant="outline" 
                                        className="text-xs px-2 py-0.5 bg-secondary/50 hover:bg-secondary transition-colors"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                    {user.skills.length > 3 && (
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50">
                                        +{user.skills.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground/60 italic">No skills added</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="pt-3 border-t space-y-1.5 h-16 flex-shrink-0">
                              <div className="flex items-center justify-between text-xs h-5">
                                <span className="text-muted-foreground">Assigned Tasks</span>
                                <span className="font-semibold text-foreground">{user._count?.assignedTasks || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs h-5">
                                <span className="text-muted-foreground">Projects</span>
                                <span className="font-semibold text-foreground">{user._count?.createdProjects || 0}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-3 flex flex-col  space-y-2 flex-shrink-0">
                            {isAdminOrManager && user.id !== currentUser?.id && (
                              <div className="flex gap-2 h-8">
                                {!user.isActive ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleActivate(user.id)}
                                    disabled={actioningUserId === user.id && isActivating}
                                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white h-8"
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                    {actioningUserId === user.id && isActivating ? 'Activating...' : 'Activate'}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeactivate(user.id)}
                                    disabled={actioningUserId === user.id && isDeactivating}
                                    className="flex-1 gap-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-8"
                                  >
                                    <UserX className="h-3.5 w-3.5" />
                                    {actioningUserId === user.id && isDeactivating ? 'Deactivating...' : 'Deactivate'}
                                  </Button>
                                )}
                              </div>
                            )}
                            <Link href={`/teams/${user.id}`}>
                              <Button 
                                variant="outline" 
                                className="w-full group/btn h-8"
                                size="sm"
                              >
                                View Details
                                <ExternalLink className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members</h3>
              <p className="text-muted-foreground mb-4">Add your first team member to get started</p>
              <Link href="/teams/new">
                <Button>Add Member</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

