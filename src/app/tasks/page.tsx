'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetTasksQuery, type Task } from '@/lib/api/taskApi'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Search, ChevronDown, ChevronUp, Calendar, User, MessageSquare, Paperclip, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TasksPage() {
  const { isAdminOrManager } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [visibleTasksCount, setVisibleTasksCount] = useState<number>(2)
  
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 })
  const { data:tasksData, isLoading } = useGetTasksQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
  })

 

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const tasks: Task[] = tasksData?.data?.tasks || []
  const projects = projectsData?.data?.projects || []

 
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800'
      case 'InProgress': return 'bg-blue-100 text-blue-800'
      case 'Review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const isExpanded = (taskId: string) => expandedTasks.has(taskId)

  const INITIAL_TASKS_COUNT = 2
  const TASKS_INCREMENT = 2

  const visibleTasks = tasks.slice(0, visibleTasksCount)
  const hasMoreTasks = tasks.length > visibleTasksCount
  const showSeeLess = visibleTasksCount > INITIAL_TASKS_COUNT

  const handleSeeMore = () => {
    setVisibleTasksCount((prev) => prev + TASKS_INCREMENT)
  }

  const handleSeeLess = () => {
    setVisibleTasksCount(INITIAL_TASKS_COUNT)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage all tasks across projects</p>
          </div>
          <Link href="/tasks/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </Link>
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
              <Select
                value={projectFilter}
                onValueChange={setProjectFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
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
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : tasks.length > 0 ? (
          <>
            <div className="space-y-5">
              {visibleTasks.map((task: Task) => {
                const expanded = isExpanded(task.id)
                return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={`${getStatusColor(task.status)} capitalize`}>
                            {task.status}
                          </Badge>
                          {task.priority && (
                            <Badge className={`${getPriorityColor(task.priority)} capitalize`}>
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {task.sprint?.project?.title} • {task.sprint?.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                     
                        <Link href={`/tasks/${task.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            toggleTask(task.id)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {task.description && (
                          <div>
                            <p className="text-sm font-medium mb-1">Description</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {task.dueDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Due Date:</span>
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {task.estimate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Estimate:</span>
                              <span>{task.estimate} hours</span>
                            </div>
                          )}

                          {task.creator && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Created by:</span>
                              <span>{task.creator.name}</span>
                            </div>
                          )}

                          {task._count && (
                            <>
                              {task._count.comments !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                  <span>{task._count.comments} comments</span>
                                </div>
                              )}
                              {task._count.attachments !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                                  <span>{task._count.attachments} attachments</span>
                                </div>
                              )}
                              {task._count.timeLogs !== undefined && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{task._count.timeLogs} time logs</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {task.assignees && task.assignees.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Assignees</p>
                            <div className="flex flex-wrap gap-2">
                              {task.assignees.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted"
                                >
                                  {assignment.user.avatar ? (
                                    <img
                                      src={assignment.user.avatar}
                                      alt={assignment.user.name}
                                      className="h-5 w-5 rounded-full"
                                    />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                                      <span className="text-xs text-primary">
                                        {assignment.user.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-sm">{assignment.user.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {task.parentTask && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Parent Task:</span>
                            <Link
                              href={`/tasks/${task.parentTask.id}`}
                              className="text-primary hover:underline"
                            >
                              {task.parentTask.title}
                            </Link>
                          </div>
                        )}

                        {task.subtasks && task.subtasks.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Subtasks ({task.subtasks.length})
                            </p>
                            <div className="space-y-1">
                              {task.subtasks.map((subtask) => (
                                <Link
                                  key={subtask.id}
                                  href={`/tasks/${subtask.id}`}
                                  className="block text-sm text-muted-foreground hover:text-primary"
                                >
                                  • {subtask.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                )
              })}
            </div>

            {(hasMoreTasks || showSeeLess) && (
              <div className="flex justify-center pt-4">
                {hasMoreTasks && (
                  <Button
                    variant="outline"
                    onClick={handleSeeMore}
                    className="mr-2"
                  >
                    See More ({tasks.length - visibleTasksCount} remaining)
                  </Button>
                )}
                {showSeeLess && (
                  <Button
                    variant="ghost"
                    onClick={handleSeeLess}
                  >
                    See Less
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

