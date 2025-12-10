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
import { useCreateUserMutation, useInviteUserMutation } from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, UserPlus, Mail, Building2, Briefcase, Send } from 'lucide-react'
import Link from 'next/link'

// Zod schema for team member creation
const teamMemberSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().optional(),
  role: z.enum(['Admin', 'Manager', 'Member']),
  department: z.string().optional(),
  skills: z.string().optional(),
  useInvite: z.boolean().default(false),
  sendEmail: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (!data.useInvite) {
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is required',
        path: ['password'],
      })
    } else if (data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must be at least 6 characters long',
        path: ['password'],
      })
    }
  }
})

type TeamMemberFormData = z.infer<typeof teamMemberSchema>

export default function NewTeamMemberPage() {
  const router = useRouter()
  const { user, isAdminOrManager } = useAuth()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation()
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError: setFormError,
    reset,
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'Member',
      department: '',
      skills: '',
      sendEmail: true,
      useInvite: false,
    },
  })

  const useInvite = watch('useInvite')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ inviteToken?: string; inviteUrl?: string } | null>(null)
  const isLoading = isCreating || isInviting

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to add team members.</p>
          <Link href="/teams">
            <Button variant="outline" className="mt-4">
              Back to Teams
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }


  const canCreateAdminOrManager = user?.role === 'Admin'

  const onSubmit = async (data: TeamMemberFormData) => {
    setError('')
    setSuccess(false)

    if ((data.role === 'Admin' || data.role === 'Manager') && !canCreateAdminOrManager) {
      setFormError('role', {
        message: 'Only Admins can create Admin or Manager roles'
      })
      return
    }

    try {
      const skillsArray = data.skills
        ? data.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
        : undefined

      if (data.useInvite) {
        const result = await inviteUser({
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department || undefined,
          skills: skillsArray,
          sendEmail: data.sendEmail,
        }).unwrap()

        if (result.success && result.data) {
          setSuccess(true)
          const resultData = result.data
          if (resultData.inviteToken || resultData.inviteUrl) {
            setInviteResult({
              inviteToken: resultData.inviteToken,
              inviteUrl: resultData.inviteUrl,
            })
          } else if (resultData.id) {
            setTimeout(() => {
              router.push(`/teams/${resultData.id}`)
            }, 2000)
          }
        }
      } else {
        const result = await createUser({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: data.role,
          department: data.department || undefined,
          skills: skillsArray,
        }).unwrap()

        if (result.success && result.data) {
          const resultData = result.data
          if (resultData.id) {
            setSuccess(true)
            setTimeout(() => {
              router.push(`/teams/${resultData.id}`)
            }, 2000)
          }
        }
      }
    } catch (err: any) {
      const errorMessage = err.data?.message ||
        err.data?.error ||
        'Failed to create team member. Please try again.'
      setError(errorMessage)
      setFormError('root', {
        message: errorMessage
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-4">
              <Link href="/teams">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Add Team Member</h1>
                <p className="text-muted-foreground">Create a new team member account</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Card className="w-full max-w-2xl border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="h-5 w-5 text-primary" />
              Team Member Information
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Fill in the details to create a new team member account. Password is optional - a random password will be generated if not provided.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {(error || errors.root) && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    {error || errors.root?.message}
                  </div>
                </div>
              )}

              {success && !inviteResult && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
                  Team member created successfully! Redirecting...
                </div>
              )}

              {success && inviteResult && (
                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200 space-y-2">
                  <p className="font-semibold">Invitation sent successfully!</p>
                  {inviteResult.inviteUrl && (
                    <div className="space-y-2">
                      <p>Share this invite link with the user:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={inviteResult.inviteUrl}
                          className="flex-1 px-3 py-2 border rounded-md bg-white text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(inviteResult.inviteUrl!)
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/teams')}
                    >
                      Back to Teams
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSuccess(false)
                        setInviteResult(null)
                        reset()
                      }}
                    >
                      Invite Another
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="name" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <UserPlus className="h-4 w-4" />
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    {...register('name')}
                    placeholder="John Doe"
                    className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.name ? 'border-destructive' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="john.doe@example.com"
                    className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                
             
                
                {!useInvite && (
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter password (minimum 6 characters)"
                      className={errors.password ? 'border-destructive' : ''}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                    {!errors.password && (
                      <p className="text-xs text-muted-foreground">
                        Password is required and must be at least 6 characters long
                      </p>
                    )}
                  </div>
                )}

                
          
                
                <div className="space-y-2 group">
                  <label htmlFor="role" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Briefcase className="h-4 w-4" />
                    Role <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!canCreateAdminOrManager && (field.value === 'Admin' || field.value === 'Manager')}
                      >
                        <SelectTrigger id="role" className={`transition-all ${errors.role ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Member">Member</SelectItem>
                          {canCreateAdminOrManager && (
                            <>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                  {!canCreateAdminOrManager && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      Only Admins can create Manager or Admin roles
                    </p>
                  )}
                </div>

                
                <div className="space-y-2 group">
                  <label htmlFor="department" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Building2 className="h-4 w-4" />
                    Department
                  </label>
                  <Input
                    id="department"
                    type="text"
                    {...register('department')}
                    placeholder="Engineering, Design, etc."
                    className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.department ? 'border-destructive' : ''}`}
                  />
                  {errors.department && (
                    <p className="text-sm text-destructive">{errors.department.message}</p>
                  )}
                </div>

                
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="skills" className="text-sm font-semibold group-hover:text-primary transition-colors">
                    Skills
                  </label>
                  <Input
                    id="skills"
                    type="text"
                    {...register('skills')}
                    placeholder="React, Node.js, TypeScript (comma-separated)"
                    className={`transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.skills ? 'border-destructive' : ''}`}
                  />
                  {errors.skills && (
                    <p className="text-sm text-destructive">{errors.skills.message}</p>
                  )}
                  {!errors.skills && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                      Enter skills separated by commas
                    </p>
                  )}
                </div>
              </div>

              
              <div className="flex items-center justify-between gap-4 pt-6 border-t bg-muted/20 -mx-6 -mb-6 px-6 pb-6">
                <Link href="/teams" className="flex-1">
                  <Button type="button" variant="outline" disabled={isLoading} className="w-full hover:bg-accent transition-colors">
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
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      {useInvite ? 'Sending Invite...' : 'Creating...'}
                    </span>
                  ) : success ? (
                    'Done!'
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {useInvite ? 'Send Invitation' : 'Create Team Member'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

