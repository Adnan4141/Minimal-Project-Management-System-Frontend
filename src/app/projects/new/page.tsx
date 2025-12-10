'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateProjectMutation } from '@/lib/api/projectApi'
import { useGetUsersQuery } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, UserCheck, Briefcase, Calendar, DollarSign, FileText, Building2, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'

// Zod schema for project creation
const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  client: z.string().min(1, 'Client name is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0),
    { message: 'Budget must be a positive number' }
  ),
  status: z.enum(['planned', 'active', 'completed', 'archived']).default('planned'),
  managerId: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate)
    }
    return true
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
)

type ProjectFormData = z.infer<typeof projectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const { isAdminOrManager } = useAuth()
  const [createProject, { isLoading }] = useCreateProjectMutation()
  const { data: usersData } = useGetUsersQuery({ limit: 100 })
  
  const managersAndAdmins = usersData?.data?.users?.filter(
    (user) => (user.role === 'Manager' || user.role === 'Admin') && user.isActive
  ) || []

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      client: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
      status: 'planned',
      managerId: '',
    },
  })

  const startDate = watch('startDate')

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to create projects.</p>
        </div>
      </DashboardLayout>
    )
  }

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const result = await createProject({
        title: data.title,
        client: data.client,
        description: data.description || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget ? parseFloat(data.budget) : undefined,
        status: data.status as any,
        managerId: data.managerId && data.managerId !== 'none' ? data.managerId : undefined,
      }).unwrap()

      if (result.success && result.data) {
        router.push(`/projects/${result.data.id}`)
      }
    } catch (err: any) {
      setFormError('root', {
        message: err.data?.message || 'Failed to create project'
      })
    }
  }
    

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/projects">
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
                Create New Project
              </h1>
              <p className="text-muted-foreground mt-1">Add a new project to your workspace</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-primary" />
                Project Information
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Enter the details for your new project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {errors.root && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    {errors.root.message}
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
                  {...register('title')}
                  placeholder="Enter project title"
                  className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.title ? 'border-destructive' : ''}`}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2 group">
                <label htmlFor="client" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Building2 className="h-4 w-4" />
                  Client Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="client"
                  {...register('client')}
                  placeholder="Enter client name"
                  className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.client ? 'border-destructive' : ''}`}
                />
                {errors.client && (
                  <p className="text-sm text-destructive">{errors.client.message}</p>
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
                  placeholder="Enter project description..."
                  rows={4}
                  className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${errors.description ? 'border-destructive' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 group">
                  <label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        id="startDate"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select start date"
                        className={errors.startDate ? 'border-destructive' : ''}
                      />
                    )}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="endDate" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Calendar className="h-4 w-4" />
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePickerInput
                        id="endDate"
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select end date"
                        minDate={startDate || undefined}
                        className={errors.endDate ? 'border-destructive' : ''}
                      />
                    )}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-destructive">{errors.endDate.message}</p>
                  )}
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
                      {...register('budget')}
                      placeholder="0.00"
                      className={`pl-9 transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.budget ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.budget && (
                    <p className="text-sm text-destructive">{errors.budget.message}</p>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="status" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Briefcase className="h-4 w-4" />
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
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 group">
                <label htmlFor="managerId" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                  <UserCheck className="h-4 w-4" />
                  Project Manager <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
                </label>
                <Controller
                  name="managerId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="managerId" className="w-full transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {managersAndAdmins.length > 0 ? (
                          <>
                            <SelectItem value="none">No manager assigned</SelectItem>
                            {managersAndAdmins.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} - {user.role} {user.department ? `(${user.department})` : ''}
                              </SelectItem>
                            ))}
                          </>
                        ) : null}
                      </SelectContent>
                    </Select>
                  )}
                />
                {managersAndAdmins.length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-2 p-2 rounded-md bg-muted/30">
                    <Users className="h-3.5 w-3.5" />
                    No active managers or admins found. Only active users with Manager or Admin role can be assigned.
                  </p>
                )}
              </div>
            </CardContent>
            <CardContent className="flex items-center justify-between gap-4 pt-6 border-t bg-muted/20">
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="outline" className="w-full hover:bg-accent transition-colors">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Create Project
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

