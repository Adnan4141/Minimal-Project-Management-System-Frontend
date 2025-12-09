'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetSprintByIdQuery } from '@/lib/api/sprintApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, ChevronDown, ChevronRight, Calendar, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function SprintDetailPage() {
  const params = useParams()
  const sprintId = params.id as string
  const { user, isAdminOrManager } = useAuth()
  const { data, isLoading } = useGetSprintByIdQuery(sprintId)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const sprint = data?.data
  const tasks = sprint?.tasks || []

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }


  const tasksByStatus = {
    ToDo: tasks.filter((t) => t.status === 'ToDo'),
    InProgress: tasks.filter((t) => t.status === 'InProgress'),
    Review: tasks.filter((t) => t.status === 'Review'),
    Done: tasks.filter((t) => t.status === 'Done'),
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  const totalTasks = tasks.length
  const completedTasks = tasksByStatus.Done.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      </DashboardLayout>
    )
  }

  if (!sprint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sprint not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/projects/${sprint.projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">
                Sprint {sprint.sprintNumber}: {sprint.title}
              </h1>
              <p className="text-muted-foreground">
                {sprint.project?.title} • {sprint.project?.client}
              </p>
            </div>
          </div>
        </div>

        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {formatDate(sprint.startDate)} -{' '}
                {formatDate(sprint.endDate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">
                {completedTasks} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        
        {sprint.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {sprint.description}
              </p>
            </CardContent>
          </Card>
        )}

        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(['ToDo', 'InProgress', 'Review', 'Done'] as const).map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{status}</span>
                  <Badge className={getStatusColor(status)}>
                    {tasksByStatus[status].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasksByStatus[status].map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Link href={`/tasks/${task.id}`}>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm flex-1">{task.title}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.preventDefault()
                                toggleTask(task.id)
                              }}
                            >
                              {expandedTasks[task.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            {task.estimate && (
                              <span className="text-xs text-muted-foreground">
                                {task.estimate}h
                              </span>
                            )}
                          </div>
                          {expandedTasks[task.id] && (
                            <div className="pt-2 border-t space-y-2 text-xs">
                              {task.description && (
                                <p className="text-muted-foreground line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Assigned to:</span>
                                  <span className="font-medium">
                                    {task.assignees.map((a) => a.user.name).join(', ')}
                                  </span>
                                </div>
                              )}
                              {task.dueDate && (
                                <p className="text-muted-foreground">
                                  Due: {formatDate(task.dueDate)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

