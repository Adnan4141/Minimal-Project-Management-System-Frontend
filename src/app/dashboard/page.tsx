'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useGetDashboardStatsQuery } from '@/lib/api/reportApi'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useGetTasksQuery } from '@/lib/api/taskApi'
import { useAuth } from '@/hooks/useAuth'
import { FolderKanban, Users, CheckSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import clsx from 'clsx'

export default function DashboardPage() {
  const { user, isAdminOrManager } = useAuth()
  const { data: statsData, isLoading: statsLoading } = useGetDashboardStatsQuery(undefined, {
    skip: !isAdminOrManager,
  })
  const { data: projectsData, isLoading: projectsLoading } = useGetProjectsQuery(
    { page: 1, limit: 3 },
    { skip: !isAdminOrManager }
  )
  const { data: tasksData, isLoading: tasksLoading } = useGetTasksQuery(
    { page: 1, limit: 3 },
    { skip: !isAdminOrManager }
  )

  const stats = statsData?.data

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}!
          </p>
        </div>

        {isAdminOrManager && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.projects?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.projects?.active || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.tasks?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.tasks?.completed || 0} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.users?.total || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? '...' : `${stats?.timeLogged?.total || 0}`}
                  </div>
                  <p className="text-xs text-muted-foreground">Total hours</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>Your latest project updates</CardDescription>
                  </div>
                  <Link href="/projects">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : projectsData?.data?.projects?.length ? (
                  <div className="space-y-4">
                    {projectsData.data.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{project.title}</h3>
                            <p className="text-sm text-muted-foreground">{project.client}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {project.stats?.progressPercentage.toFixed(0) || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {project.stats?.completedTasks || 0}/{project.stats?.totalTasks || 0} tasks
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No projects yet. Create your first project!
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tasks</CardTitle>
                    <CardDescription>Tasks that need attention</CardDescription>
                  </div>
                  <Link href="/tasks">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : tasksData?.data?.tasks?.length ? (
                  <div className="space-y-4">
                    {tasksData?.data?.tasks.map((task) => (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {task.sprint?.project?.title} • {task.sprint?.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              task.status === 'Done' ? 'bg-green-100 text-green-800' :
                              task.status === 'InProgress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'Review' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!isAdminOrManager && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to MPMS</CardTitle>
              <CardDescription>
                View your assigned tasks and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Link href="/my-tasks">
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        My Tasks
                      </CardTitle>
                      <CardDescription>View and manage your assigned tasks</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
                <Link href="/my-projects">
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        My Projects
                      </CardTitle>
                      <CardDescription>View projects you're working on</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

