'use client'

import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '@/lib/api/projectApi'
import { useGetSprintsQuery, useCreateSprintMutation } from '@/lib/api/sprintApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Edit, Trash2, Plus, Calendar, DollarSign, User, X, Loader2, AlertCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { DatePickerInput } from '@/components/ui/date-picker'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { user, isAdminOrManager } = useAuth()
  const { data, isLoading } = useGetProjectByIdQuery(projectId)
  const { data: sprintsData } = useGetSprintsQuery({ projectId })
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation()
  const [createSprint, { isLoading: isCreatingSprint }] = useCreateSprintMutation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false)
  const [sprintFormData, setSprintFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
  })
  const [sprintError, setSprintError] = useState('')

  const project = data?.data
  const sprints = sprintsData?.data || []


  const formatDateForInput = (date: string | Date): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDelete = async () => {
    try {
      await deleteProject(projectId).unwrap()
      router.push('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault()
    setSprintError('')

    if (!sprintFormData.title || !sprintFormData.startDate || !sprintFormData.endDate) {
      setSprintError('Please fill in all required fields')
      return
    }

    if (!project) {
      setSprintError('Project not found')
      return
    }

    const sprintStartDate = new Date(sprintFormData.startDate)
    const sprintEndDate = new Date(sprintFormData.endDate)
    const projectStartDate = new Date(project.startDate)
    const projectEndDate = new Date(project.endDate)


    sprintStartDate.setHours(0, 0, 0, 0)
    sprintEndDate.setHours(0, 0, 0, 0)
    projectStartDate.setHours(0, 0, 0, 0)
    projectEndDate.setHours(0, 0, 0, 0)

    if (sprintStartDate >= sprintEndDate) {
      setSprintError('End date must be after start date')
      return
    }

    if (sprintStartDate < projectStartDate) {
      setSprintError(`Start date must be on or after project start date (${formatDateForInput(project.startDate)})`)
      return
    }

    if (sprintEndDate > projectEndDate) {
      setSprintError(`End date must be on or before project end date (${formatDateForInput(project.endDate)})`)
      return
    }

    try {
      await createSprint({
        title: sprintFormData.title,
        startDate: sprintFormData.startDate,
        endDate: sprintFormData.endDate,
        description: sprintFormData.description || undefined,
        projectId,
      }).unwrap()
      
      setShowCreateSprintModal(false)
      setSprintFormData({
        title: '',
        startDate: '',
        endDate: '',
        description: '',
      })
      setSprintError('')
    } catch (err: any) {
      setSprintError(err.data?.message || 'Failed to create sprint')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading project...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found</p>
          <Link href="/projects">
            <Button variant="outline" className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }








  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <p className="text-muted-foreground">{project.client}</p>
            </div>
          </div>
          {isAdminOrManager && (
            <div className="flex gap-2">
              <Link href={`/projects/${projectId}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        
        {showDeleteConfirm && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Delete Project</CardTitle>
              <CardDescription>
                Are you sure you want to delete this project? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {project.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sprints</CardTitle>
                    <CardDescription>Project milestones and sprints</CardDescription>
                  </div>
                  {isAdminOrManager && (
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setShowCreateSprintModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      New Sprint
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sprints.length > 0 ? (
                  <div className="space-y-4">
                    {sprints.map((sprint) => (
                      <div
                        key={sprint.id}
                        className="p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <Link href={`/sprints/${sprint.id}`} className="flex-1">
                            <div>
                              <h3 className="font-semibold">
                                Sprint {sprint.sprintNumber}: {sprint.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                                {new Date(sprint.endDate).toLocaleDateString()}
                              </p>
                              {sprint.stats && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Progress</span>
                                    <span className="text-xs font-medium">
                                      {sprint.stats.progressPercentage.toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${sprint.stats.progressPercentage}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {sprint.stats.completedTasks} of {sprint.stats.totalTasks} tasks completed
                                  </p>
                                </div>
                              )}
                            </div>
                          </Link>
                          {isAdminOrManager && (
                            <Link href={`/sprints/${sprint.id}/edit`}>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No sprints yet. {isAdminOrManager && 'Create your first sprint!'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          
          <div className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge className={`${getStatusColor(project.status)} capitalize`}>
                    {project.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.startDate).toLocaleDateString()} -{' '}
                    {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>
                {project.budget && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${project.budget.toLocaleString()}
                    </p>
                  </div>
                )}
                {project.creator && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Created By
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.creator.name}
                    </p>
                  </div>
                )}
                {project.manager && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Manager
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.manager.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            
            {project.stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <span className="text-sm font-medium">
                        {project.stats.progressPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${project.stats.progressPercentage}%` }}
                      />
                    </div>
                    <div className="pt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tasks</span>
                        <span className="font-medium">{project.stats.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium text-green-600">
                          {project.stats.completedTasks}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">In Progress</span>
                        <span className="font-medium text-blue-600">
                         {project.stats.inProgressTasks ?? 0} 
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">
                          {project.stats.tasksRemaining ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      
      {showCreateSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateSprintModal(false)}
          />
          <div className="relative z-50 w-full max-w-2xl mx-4 bg-background border rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto scrollbar-hide overscroll-contain">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Create New Sprint</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCreateSprintModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-4">
              {sprintError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {sprintError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="sprint-title" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="sprint-title"
                  value={sprintFormData.title}
                  onChange={(e) => setSprintFormData({ ...sprintFormData, title: e.target.value })}
                  placeholder="e.g., Sprint 1: User Authentication"
                  required
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="sprint-start-date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <DatePickerInput
                    id="sprint-start-date"
                    value={sprintFormData.startDate}
                    onChange={(date) => setSprintFormData({ ...sprintFormData, startDate: date })}
                    placeholder="Select start date"
                    minDate={project ? project.startDate : undefined}
                    maxDate={project ? project.endDate : undefined}
                    required
                  />
                  {project && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Project timeline: {formatDateForInput(project.startDate)} - {formatDateForInput(project.endDate)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="sprint-end-date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <DatePickerInput
                    id="sprint-end-date"
                    value={sprintFormData.endDate}
                    onChange={(date) => setSprintFormData({ ...sprintFormData, endDate: date })}
                    placeholder="Select end date"
                    minDate={sprintFormData.startDate || (project ? project.startDate : undefined)}
                    maxDate={project ? project.endDate : undefined}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="sprint-description" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </label>
                <Textarea
                  id="sprint-description"
                  value={sprintFormData.description}
                  onChange={(e) => setSprintFormData({ ...sprintFormData, description: e.target.value })}
                  placeholder="Enter sprint description..."
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateSprintModal(false)
                    setSprintFormData({
                      title: '',
                      startDate: '',
                      endDate: '',
                      description: '',
                    })
                    setSprintError('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingSprint}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                >
                  {isCreatingSprint ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sprint
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

