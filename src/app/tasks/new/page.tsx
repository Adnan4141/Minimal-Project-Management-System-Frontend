'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTaskMutation } from '@/lib/api/taskApi'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useGetSprintsQuery } from '@/lib/api/sprintApi'
import { useGetUsersQuery } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, FileText, Calendar, Clock, AlertCircle, Users, Target, Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'

// Zod schema for task creation
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  estimate: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
    { message: 'Estimate must be a positive number' }
  ),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Done']).default('ToDo'),
  dueDate: z.string().optional().refine(
    (val) => !val || new Date(val) >= new Date(new Date().setHours(0, 0, 0, 0)),
    { message: 'Due date cannot be in the past' }
  ),
  sprintId: z.string().min(1, 'Sprint is required'),
  assigneeIds: z.array(z.string()).default([]),
})

type TaskFormData = z.infer<typeof taskSchema>

export default function NewTaskPage() {
  const router = useRouter()
  const { isAdminOrManager, user: currentUser } = useAuth()
  const [createTask, { isLoading }] = useCreateTaskMutation()
  const { data: projectsData } = useGetProjectsQuery({ page: 1, limit: 100 })
  const { data: usersData } = useGetUsersQuery({ limit: 100 })
  
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const { data: sprintsData } = useGetSprintsQuery(
    { projectId: selectedProjectId },
    { skip: !selectedProjectId }
  )

  const projects = projectsData?.data?.projects || []
  const sprints = sprintsData?.data || []
  const allUsers = usersData?.data?.users || []
  
  const users = allUsers.filter((user) => {
    if (!user.isActive) return false
    if (currentUser?.role === 'Admin') {
      return user.role === 'Manager' || user.role === 'Member'
    }
    if (currentUser?.role === 'Manager') {
      return user.role === 'Manager' || user.role === 'Member'
    }
    return false
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    setError: setFormError,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      estimate: '',
      priority: 'Medium',
      status: 'ToDo',
      dueDate: '',
      sprintId: '',
      assigneeIds: [],
    },
  })

  const assigneeIds = watch('assigneeIds')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (selectedProjectId) {
      setValue('sprintId', '')
    }
  }, [selectedProjectId, setValue])

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to create tasks.</p>
        </div>
      </DashboardLayout>
    )
  }

  const onSubmit = async (data: TaskFormData) => {
    setError('')
    setSuccess(false)

    try {
      const result = await createTask({
        title: data.title,
        description: data.description || undefined,
        estimate: data.estimate ? parseFloat(data.estimate) : undefined,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate || undefined,
        sprintId: data.sprintId,
        assigneeIds: data.assigneeIds.length > 0 ? data.assigneeIds : undefined,
      }).unwrap()

      if (result.success && result.data) {
        setSuccess(true)
        const taskId = result.data?.id
        if (taskId) {
          setTimeout(() => {
            router.push(`/tasks/${taskId}`)
          }, 1500)
        }
      }
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create task')
      setFormError('root', {
        message: err?.data?.message || 'Failed to create task'
      })
    }
  }

  const handleAssigneeToggle = (userId: string) => {
    const currentIds = assigneeIds || []
    const newIds = currentIds.includes(userId)
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId]
    setValue('assigneeIds', newIds)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Create New Task
              </h1>
              <p className="text-muted-foreground mt-1">Add a new task to a sprint</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Task Information
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Enter the details for your new task
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {(error || errors.root) && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error || errors.root?.message}
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Task created successfully! Redirecting...
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label htmlFor="title" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  Task Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g., Implement user authentication"
                  className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.title ? 'border-destructive' : ''}`}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2 group">
                <label htmlFor="description" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  Description
                </label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter task description..."
                  rows={4}
                  className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${errors.description ? 'border-destructive' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="project" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <FileText className="h-4 w-4" />
                    Project <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    required
                  >
                    <SelectTrigger id="project" className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="sprintId" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    Sprint <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="sprintId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedProjectId || sprints.length === 0}
                      >
                        <SelectTrigger id="sprintId" className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.sprintId ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder={
                            !selectedProjectId 
                              ? 'Select a project first' 
                              : sprints.length === 0 
                              ? 'No sprints available' 
                              : 'Select a sprint'
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {sprints.map((sprint) => (
                            <SelectItem key={sprint.id} value={sprint.id}>
                              Sprint {sprint.sprintNumber}: {sprint.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sprintId && (
                    <p className="text-sm text-destructive">{errors.sprintId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="priority" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <AlertCircle className="h-4 w-4" />
                    Priority
                  </label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="priority" className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.priority && (
                    <p className="text-sm text-destructive">{errors.priority.message}</p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="status" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    Status
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="status" className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ToDo">To Do</SelectItem>
                          <SelectItem value="InProgress">In Progress</SelectItem>
                          <SelectItem value="Review">Review</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="estimate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Clock className="h-4 w-4" />
                    Estimate (hours)
                  </label>
                  <Input
                    id="estimate"
                    type="number"
                    step="0.5"
                    min="0"
                    {...register('estimate')}
                    placeholder="e.g., 8"
                    className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.estimate ? 'border-destructive' : ''}`}
                  />
                  {errors.estimate && (
                    <p className="text-sm text-destructive">{errors.estimate.message}</p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="dueDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </label>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        id="dueDate"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select due date"
                        minDate={new Date().toISOString().split('T')[0]}
                        className={errors.dueDate ? 'border-destructive' : ''}
                      />
                    )}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Users className="h-4 w-4" />
                  Assignees <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                </label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={(assigneeIds || []).includes(user.id)}
                            onChange={() => handleAssigneeToggle(user.id)}
                            className="h-4 w-4 text-primary focus:ring-primary rounded"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto">
                              {user.role}
                            </Badge>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No users available
                    </p>
                  )}
                </div>
                {(assigneeIds || []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {(assigneeIds || []).length} assignee{(assigneeIds || []).length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </CardContent>
            <CardContent className="flex items-center justify-between gap-4 pt-6 border-t bg-muted/20">
              <Link href="/tasks" className="flex-1">
                <Button type="button" variant="outline" className="w-full hover:bg-accent transition-colors">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isLoading || success}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Created!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Create Task
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}

