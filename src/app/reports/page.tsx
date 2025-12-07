'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useGetDashboardStatsQuery,
  useGetProjectProgressQuery,
  useGetUserTimeSummaryQuery,
} from '@/lib/api/reportApi'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useGetUsersQuery } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import {
  BarChart3,
  FolderKanban,
  Users,
  CheckSquare,
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const { isAdminOrManager } = useAuth()
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')

  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined, {
    skip: !isAdminOrManager,
  })
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 })
  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 })
  const { data: projectProgressData, isLoading: projectProgressLoading, error: projectProgressError } = useGetProjectProgressQuery(selectedProject, {
    skip: selectedProject === 'all' || !selectedProject,
  })
  const { data: userTimeData } = useGetUserTimeSummaryQuery(
    {
      userId: selectedUser !== 'all' ? selectedUser : undefined,
      projectId: selectedProject !== 'all' ? selectedProject : undefined,
    },
    {
      skip: !isAdminOrManager,
    }
  )

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view reports.</p>
        </div>
      </DashboardLayout>
    )
  }

  const stats = statsData?.data
  const projects = projectsData?.data?.projects || []
  const users = usersData?.data?.users || []


  const projectProgress = projectProgressData?.data
  const userTime = userTimeData?.data

 
  if (selectedProject !== 'all' && typeof window !== 'undefined') {
    console.log('Reports Page Debug:', {
      selectedProject,
      projectProgressData,
      projectProgress,
      isLoading: projectProgressLoading,
      error: projectProgressError,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    })
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your projects and team</p>
        </div>

        
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.projects.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.projects.active} active projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users.total}</div>
                <p className="text-xs text-muted-foreground">Active users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tasks.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.tasks.completed} completed, {stats.tasks.inProgress} in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold leading-none">
                    {stats.timeLogged.total.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    hours
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Total hours logged</p>
              </CardContent>
            </Card>
          </div>
        )}

        
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter reports by project, user, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          
          {selectedProject !== 'all' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Project Progress
                </CardTitle>
                <CardDescription>
                  {projects.find((p) => p.id === selectedProject)?.title || 'Selected Project'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projectProgressLoading ? (
                  <div className="text-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading progress...</p>
                  </div>
                ) : projectProgressError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-destructive">Failed to load project progress</p>
                  </div>
                ) : projectProgress ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold">
                          {projectProgress.progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${projectProgress.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tasks</p>
                        <p className="text-2xl font-bold">{projectProgress.totalTasks}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {projectProgress.completedTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {projectProgress.inProgressTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time Logged</p>
                        <p className="text-2xl font-bold">{projectProgress.timeLogged.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No progress data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          
          {userTime && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Summary
                </CardTitle>
                <CardDescription>
                  {users.find((u) => u.id === selectedUser)?.name || 'Selected User'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{userTime.totalHours.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tasks Worked</p>
                      <p className="text-2xl font-bold">{userTime.tasksWorked}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Time by Project</p>
                    {userTime.projects.length > 0 ? (
                      <div className="space-y-2">
                        {userTime.projects.map((project) => {
                          const projectName =
                            projects.find((p) => p.id === project.projectId)?.title ||
                            'Unknown Project'
                          return (
                            <div
                              key={project.projectId}
                              className="flex items-center justify-between p-2 bg-accent rounded"
                            >
                              <span className="text-sm">{projectName}</span>
                              <span className="text-sm font-medium">{project.hours.toFixed(1)}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">No data found</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Task Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{stats.tasks.total}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{stats.tasks.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-4 border rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">{stats.tasks.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">
                    {stats.tasks.total - stats.tasks.completed - stats.tasks.inProgress}
                  </p>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/projects">
                <Button variant="outline">View All Projects</Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline">View All Tasks</Button>
              </Link>
              <Link href="/teams">
                <Button variant="outline">View Team Members</Button>
              </Link>
              <Link href="/time-log">
                <Button variant="outline">View Time Logs</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

