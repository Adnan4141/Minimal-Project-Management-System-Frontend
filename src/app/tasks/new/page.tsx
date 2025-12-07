'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewTaskPage() {
  const router = useRouter()
  const { isAdminOrManager } = useAuth()
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
  const users = usersData?.data?.users || []


  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimate: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    status: 'ToDo' as 'ToDo' | 'InProgress' | 'Review' | 'Done',
    dueDate: '',
    sprintId: '',
    assigneeIds: [] as string[],
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (selectedProjectId) {
      setFormData(prev => ({ ...prev, sprintId: '' }))
    }
  }, [selectedProjectId])

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to create tasks.</p>
        </div>
      </DashboardLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.title || !formData.sprintId) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      setError('Due date cannot be in the past')
      return
    }

    try {
      const result = await createTask({
        title: formData.title,
        description: formData.description || undefined,
        estimate: formData.estimate ? parseFloat(formData.estimate) : undefined,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || undefined,
        sprintId: formData.sprintId,
        assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : undefined,
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
    }
  }

  const handleAssigneeToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...prev.assigneeIds, userId]
    }))
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

        <form onSubmit={handleSubmit}>
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
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Implement user authentication"
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2 group">
                <label htmlFor="description" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description..."
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
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
                  <Select
                    value={formData.sprintId}
                    onValueChange={(value) => setFormData({ ...formData, sprintId: value })}
                    disabled={!selectedProjectId || sprints.length === 0}
                    required
                  >
                    <SelectTrigger id="sprintId" className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
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
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="priority" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <AlertCircle className="h-4 w-4" />
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger id="priority" className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low"> Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High"> High</SelectItem>
                      <SelectItem value="Critical"> Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="status" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
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
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="e.g., 8"
                    className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="dueDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </label>
                  <DatePickerInput
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(date) => setFormData({ ...formData, dueDate: date })}
                    placeholder="Select due date"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
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
                            checked={formData.assigneeIds.includes(user.id)}
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
                {formData.assigneeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.assigneeIds.length} assignee{formData.assigneeIds.length !== 1 ? 's' : ''} selected
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

