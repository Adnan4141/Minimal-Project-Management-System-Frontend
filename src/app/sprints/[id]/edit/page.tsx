'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useGetSprintByIdQuery, useUpdateSprintMutation } from '@/lib/api/sprintApi'
import { useGetProjectByIdQuery } from '@/lib/api/projectApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Calendar, FileText, Target, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'

export default function EditSprintPage() {
  const router = useRouter()
  const params = useParams()
  const sprintId = params.id as string
  const { isAdminOrManager, user } = useAuth()
  const { data: sprintData, isLoading: isLoadingSprint } = useGetSprintByIdQuery(sprintId)
  
  const sprint = sprintData?.data
  const projectId = sprint?.projectId

  const { data: projectData } = useGetProjectByIdQuery(projectId || '', {
    skip: !projectId,
  })
  const project = projectData?.data

  const [updateSprint, { isLoading }] = useUpdateSprintMutation()

  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (sprint) {
      setFormData({
        title: sprint.title || '',
        startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
        endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
        description: sprint.description || '',
      })
    }
  }, [sprint])

  if (isLoadingSprint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading sprint...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!sprint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Sprint not found</p>
          <Link href={projectId ? `/projects/${projectId}` : '/projects'}>
            <Button variant="outline" className="mt-4">Back to Project</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }


  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to edit this sprint.</p>
          <Link href={`/sprints/${sprintId}`}>
            <Button variant="outline" className="mt-4">Back to Sprint</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }


  const formatDateForInput = (date: string | Date): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields')
      return
    }

    const sprintStartDate = new Date(formData.startDate)
    const sprintEndDate = new Date(formData.endDate)
    

    sprintStartDate.setHours(0, 0, 0, 0)
    sprintEndDate.setHours(0, 0, 0, 0)

    if (sprintStartDate >= sprintEndDate) {
      setError('End date must be after start date')
      return
    }

    if (project) {
      const projectStartDate = new Date(project.startDate)
      const projectEndDate = new Date(project.endDate)
      

      projectStartDate.setHours(0, 0, 0, 0)
      projectEndDate.setHours(0, 0, 0, 0)

      if (sprintStartDate < projectStartDate) {
        setError(`Start date must be on or after project start date (${formatDateForInput(project.startDate)})`)
        return
      }

      if (sprintEndDate > projectEndDate) {
        setError(`End date must be on or before project end date (${formatDateForInput(project.endDate)})`)
        return
      }
    }

    try {
      const result = await updateSprint({
        id: sprintId,
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description || undefined,
      }).unwrap()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/sprints/${sprintId}`)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update sprint')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={projectId ? `/projects/${projectId}` : `/sprints/${sprintId}`}>
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
                Edit Sprint
              </h1>
              <p className="text-muted-foreground mt-1">
                {project ? `Update sprint for ${project.title}` : 'Update sprint details'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Sprint Information
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Update the details for this sprint
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
                    Sprint updated successfully! Redirecting...
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label htmlFor="title" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  Sprint Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Sprint 1: User Authentication"
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <DatePickerInput
                    id="startDate"
                    value={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    placeholder="Select start date"
                    minDate={project ? project.startDate : undefined}
                    maxDate={project ? project.endDate : formData.endDate || undefined}
                    required
                  />
                  {project && (
                    <p className="text-xs text-muted-foreground">
                      Project timeline: {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="endDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <DatePickerInput
                    id="endDate"
                    value={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    placeholder="Select end date"
                    minDate={formData.startDate || (project ? project.startDate : undefined)}
                    maxDate={project ? project.endDate : undefined}
                    required
                  />
                </div>
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
                  placeholder="Enter sprint description..."
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {project && (
                <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium">Project Information</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Project:</span> {project.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Sprint Number:</span> {sprint.sprintNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Sprint number cannot be changed. Dates must be within the project timeline.
                  </p>
                </div>
              )}
            </CardContent>
            <CardContent className="flex items-center justify-between gap-4 pt-6 border-t bg-muted/20">
              <Link href={projectId ? `/projects/${projectId}` : `/sprints/${sprintId}`} className="flex-1">
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
                    Updating...
                  </span>
                ) : success ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Updated!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Update Sprint
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

