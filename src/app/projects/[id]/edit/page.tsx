'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetProjectByIdQuery, useUpdateProjectMutation } from '@/lib/api/projectApi'
import { useGetUsersQuery } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, UserCheck, Briefcase, Calendar, DollarSign, FileText, Building2, Users, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { isAdminOrManager, user } = useAuth()
  const { data: projectData, isLoading: isLoadingProject } = useGetProjectByIdQuery(projectId)
  const [updateProject, { isLoading }] = useUpdateProjectMutation()
  const { data: usersData } = useGetUsersQuery({ limit: 100 })
  
  const managersAndAdmins = usersData?.data?.users?.filter(
    (user) => (user.role === 'Manager' || user.role === 'Admin') && user.isActive
  ) || []

  const project = projectData?.data

  const [formData, setFormData] = useState({
    title: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'planned' as 'planned' | 'active' | 'completed' | 'archived',
    managerId: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        client: project.client || '',
        description: project.description || '',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        budget: project.budget ? project.budget.toString() : '',
        status: project.status || 'planned',
        managerId: project.managerId || '',
      })
    }
  }, [project])

  if (isLoadingProject) {
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


  const canEdit = isAdminOrManager || 
    project.creatorId === user?.id || 
    project.managerId === user?.id

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to edit this project.</p>
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline" className="mt-4">Back to Project</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!formData.title || !formData.client || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields')
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date')
      return
    }

    try {
      const result = await updateProject({
        id: projectId,
        title: formData.title,
        client: formData.client,
        description: formData.description || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        status: formData.status,
        managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined,
      }).unwrap()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/projects/${projectId}`)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.data?.message || 'Failed to update project')
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Edit Project
              </h1>
              <p className="text-muted-foreground mt-1">Update project details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Project Information
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Update the details for your project
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
                    Project updated successfully! Redirecting...
                  </div>
                </div>
              )}

              <div className="space-y-2 group">
                <label htmlFor="title" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <FileText className="h-4 w-4" />
                  Project Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter project title"
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2 group">
                <label htmlFor="client" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="h-4 w-4" />
                  Client Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  placeholder="Enter client name"
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
                  placeholder="Enter project description..."
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
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
                    required
                  />
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
                    minDate={formData.startDate || undefined}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="budget" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                      className="pl-9 transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="status" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Briefcase className="h-4 w-4" />
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
                      <SelectItem value="planned"> Planned</SelectItem>
                      <SelectItem value="active"> Active</SelectItem>
                      <SelectItem value="completed"> Completed</SelectItem>
                      <SelectItem value="archived"> Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label htmlFor="managerId" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <UserCheck className="h-4 w-4" />
                  Project Manager <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                </label>
                <Select
                  value={formData.managerId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger id="managerId" className="w-full transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managersAndAdmins.length > 0 ? (
                      <>
                        <SelectItem value="none"> No manager assigned</SelectItem>
                        {managersAndAdmins.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.role} {user.department ? `(${user.department})` : ''}
                          </SelectItem>
                        ))}
                      </>
                    ) : null}
                  </SelectContent>
                </Select>
                {managersAndAdmins.length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-2 p-2 rounded-md bg-muted/30">
                    <Users className="h-3.5 w-3.5" />
                    No active managers or admins found. Only active users with Manager or Admin role can be assigned.
                  </p>
                )}
              </div>
            </CardContent>
            <CardContent className="flex items-center justify-between gap-4 pt-6 border-t bg-muted/20">
              <Link href={`/projects/${projectId}`} className="flex-1">
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
                    Update Project
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

