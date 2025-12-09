'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import {
  useGetUserByIdQuery,
  useGetTeamMemberStatsQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import {
  ArrowLeft,
  Mail,
  Building2,
  Briefcase,
  Clock,
  CheckCircle,
  Activity,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function TeamMemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const { user, isAdminOrManager } = useAuth()
  const { data, isLoading } = useGetUserByIdQuery(memberId)
  const { data: statsData, isLoading: statsLoading } = useGetTeamMemberStatsQuery(memberId)
  const [updateUser] = useUpdateUserMutation()
  const [deleteUser] = useDeleteUserMutation()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)


  const member = data?.data;
 
  const stats = statsData?.data

   

  
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800'
      case 'InProgress':
        return 'bg-blue-100 text-blue-800'
      case 'Review':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(memberId).unwrap()
      router.push('/teams')
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleToggleActive = async () => {
    if (!member) return
    try {
      await updateUser({
        id: memberId,
        isActive: !member.isActive,
      }).unwrap()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  if (isLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      </DashboardLayout>
    )
  }

  if (!member) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Team member not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const canEdit = isAdminOrManager || user?.id === memberId

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teams">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative">
                {member.avatar ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.parentElement?.querySelector('.avatar-fallback') as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div className="avatar-fallback absolute inset-0 h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold hidden">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-2xl font-bold shadow-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {member.isActive && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-md">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{member.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{member.email}</span>
                  <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                  {!member.isActive && (
                    <Badge variant="outline" className="bg-red-50 text-red-800">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Link href={`/teams/${memberId}/edit`}>
                <Button variant="outline">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              {isAdminOrManager && user?.id !== memberId && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleToggleActive}
                  >
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {member.department || 'Not specified'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {formatDate(member.createdAt)}
              </p>
            </CardContent>
          </Card>
          {member.skills && member.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, idx) => (
                    <Badge key={idx} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        
        {stats && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.statistics.tasks.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.statistics.tasks.completed} completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.statistics.tasks.completionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.statistics.tasks.completed} of {stats.statistics.tasks.total} tasks
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projects</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.statistics.projects.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.statistics.projects.created} created, {stats.statistics.projects.managed} managed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.statistics.time.totalHours.toFixed(1)}h
                  </div>
                  <p className="text-xs text-muted-foreground">Total hours</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentTasks.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentTasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/tasks/${task.id}`}
                          className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{task.title}</p>
                              {task.project && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {task.project.title}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={`${getStatusColor(task.status)} capitalize`}>
                                  {task.status}
                                </Badge>
                                <Badge variant="outline">{task.priority}</Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks assigned yet
                    </p>
                  )}
                </CardContent>
              </Card>

              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 border rounded-lg"
                        >
                          <p className="text-sm font-medium">{activity.description}</p>
                          {activity.task && (
                            <Link
                              href={`/tasks/${activity.task.id}`}
                              className="text-xs text-primary hover:underline mt-1 block"
                            >
                              {activity.task.title}
                            </Link>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activities
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            
            {stats.statistics.time.byProject.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Logged by Project
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.statistics.time.byProject.map((project) => (
                      <div
                        key={project.projectId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{project.projectTitle}</p>
                        </div>
                        <Badge variant="outline" className="font-semibold">
                          {project.hours.toFixed(1)}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Team Member"
        description={`Are you sure you want to deactivate ${member.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </DashboardLayout>
  )
}

