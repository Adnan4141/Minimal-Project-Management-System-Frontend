'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGetTasksQuery, useUpdateTaskMutation, type Task } from '@/lib/api/taskApi'
import { useAuth } from '@/hooks/useAuth'
import { CheckSquare, Search, Filter, Play, CheckCircle2, AlertCircle, X, ShieldCheck, Check, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MyTasksPage() {
  const { user, isAdminOrManager } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState('')
  
  const { data:tasksData, isLoading, refetch } = useGetTasksQuery({
    page,
    limit: 20,
    assigneeId: user?.id,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  })
  const [updateTask] = useUpdateTaskMutation()

  const tasks =  tasksData?.data?.tasks || []
  const pagination = tasksData?.data?.pagination

  useEffect(() => {
    if (statusError) {
      const timer = setTimeout(() => {
        setStatusError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [statusError])

  const handleStatusUpdate = async (taskId: string, newStatus: 'InProgress' | 'Review') => {
    setUpdatingTaskId(taskId)
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: newStatus,
      }).unwrap()
      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to update task status'
      setStatusError(errorMessage)
      console.error('Failed to update task status:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleApproveTask = async (taskId: string) => {
    setUpdatingTaskId(taskId)
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: 'Done',
      }).unwrap()
      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to approve task'
      setStatusError(errorMessage)
      console.error('Failed to approve task:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleRejectTask = async (taskId: string) => {
    setUpdatingTaskId(taskId)
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: 'InProgress',
      }).unwrap()
      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to reject task'
      setStatusError(errorMessage)
      console.error('Failed to reject task:', error)
    } finally {
      setUpdatingTaskId(null)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">View and manage your assigned tasks</p>
        </div>

        
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ToDo">To Do</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-4">
            {statusError && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-2 text-destructive">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <p className="text-sm">{statusError}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusError('')}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {tasks.map((task: Task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/tasks/${task.id}`} className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold hover:text-primary transition-colors">{task.title}</h3>
                        <Badge className={`${getStatusColor(task.status)} capitalize`}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.sprint && (
                          <span>
                            {task.sprint.project?.title} • Sprint {task.sprint.sprintNumber}
                          </span>
                        )}
                        {task.dueDate && (
                          <span>
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.estimate && (
                          <span>Est: {task.estimate}h</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {task.status === 'ToDo' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleStatusUpdate(task.id, 'InProgress')
                          }}
                          disabled={updatingTaskId === task.id}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          {updatingTaskId === task.id ? 'Starting...' : 'Start Task'}
                        </Button>
                      )}
                      {task.status === 'InProgress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleStatusUpdate(task.id, 'Review')
                          }}
                          disabled={updatingTaskId === task.id}
                          className="gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {updatingTaskId === task.id ? 'Submitting...' : 'Mark for Review'}
                        </Button>
                      )}
                      {task.status === 'Review' && isAdminOrManager && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleApproveTask(task.id)
                            }}
                            disabled={updatingTaskId === task.id}
                            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4" />
                            {updatingTaskId === task.id ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault()
                              handleRejectTask(task.id)
                            }}
                            disabled={updatingTaskId === task.id}
                            className="gap-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          >
                            <XCircle className="h-4 w-4" />
                            {updatingTaskId === task.id ? 'Rejecting...' : 'Reject'}
                          </Button>
                        </div>
                      )}
                      {task.status === 'Review' && !isAdminOrManager && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                          Awaiting Approval
                        </Badge>
                      )}
                      {task.status === 'Done' && (
                        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 dark:bg-green-900/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : "You don't have any assigned tasks yet."}
              </p>
            </CardContent>
          </Card>
        )}

        
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

