'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetTasksQuery } from '@/lib/api/taskApi'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useUpdateTaskMutation } from '@/lib/api/taskApi'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { CheckSquare, Filter } from 'lucide-react'
import Link from 'next/link'

type TaskStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done'

interface DraggedTask {
  taskId: string
  status: TaskStatus
}

export default function KanbanBoardPage() {
  const router = useRouter()
  const { user, isAdminOrManager } = useAuth()
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null)
  const [updateTask] = useUpdateTaskMutation()

  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 })
  const { data: tasksData, isLoading } = useGetTasksQuery({
    page: 1,
    limit: 1000,
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
  })

  const tasks = tasksData?.data?.tasks || []
  const projects = projectsData?.data?.projects || []




  const tasksByStatus: Record<TaskStatus, typeof tasks> = {
    ToDo: tasks.filter((t) => t.status === 'ToDo'),
    InProgress: tasks.filter((t) => t.status === 'InProgress'),
    Review: tasks.filter((t) => t.status === 'Review'),
    Done: tasks.filter((t) => t.status === 'Done'),
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'InProgress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
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

  const handleDragStart = (taskId: string, currentStatus: TaskStatus) => {
    setDraggedTask({ taskId, status: currentStatus })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (targetStatus: TaskStatus) => {
    if (!draggedTask || draggedTask.status === targetStatus) {
      setDraggedTask(null)
      return
    }


    const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager'
    if (draggedTask.status === 'Review' && targetStatus === 'Done' && !isManagerOrAdmin) {
      alert('Only Managers or Admins can approve tasks in Review status to mark them as Done')
      setDraggedTask(null)
      return
    }

    try {
      await updateTask({
        id: draggedTask.taskId,
        status: targetStatus,
      }).unwrap()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to update task status'
      alert(errorMessage)
    } finally {
      setDraggedTask(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kanban Board</h1>
            <p className="text-muted-foreground">Drag and drop tasks to update their status</p>
          </div>
          <div className="flex items-center gap-2">
        
            <Select
              value={projectFilter}
              onValueChange={setProjectFilter}
            >
              <SelectTrigger className="w-48">
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
        </div>

        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(['ToDo', 'InProgress', 'Review', 'Done'] as TaskStatus[]).map((status) => (
              <Card
                key={status}
                className={`${getStatusColor(status)} min-h-[600px]`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{status}</span>
                    <Badge variant="outline" className="bg-background/50">
                      {tasksByStatus[status].length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasksByStatus[status].map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id, task.status)}
                      onDragEnd={handleDragEnd}
                      className="bg-background p-3 rounded-lg border shadow-sm cursor-move hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={getPriorityColor(task.priority)}
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.priority}
                          </Badge>
                          {task.estimate && (
                            <span className="text-xs text-muted-foreground">
                              {task.estimate}h
                            </span>
                          )}
                        </div>
                        {task.sprint?.project && (
                          <p className="text-xs text-muted-foreground">
                            {task.sprint.project.title}
                          </p>
                        )}
                        {task.assignees && task.assignees.length > 0 && (
                          <div className="flex items-center gap-1">
                            {task.assignees.slice(0, 3).map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium"
                                title={assignment.user.name}
                              >
                                {assignment.user.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{task.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
               <strong>Tip:</strong> Drag tasks between columns to update their status. Tasks in
              Review status require Manager/Admin approval to move to Done.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

