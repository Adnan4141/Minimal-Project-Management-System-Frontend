'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewTeamMemberPage() {
  const router = useRouter()
  const { user, isAdminOrManager } = useAuth()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Member' as 'Admin' | 'Manager' | 'Member',
    department: '',
    skills: '',
    sendEmail: true,
    useInvite: false,
  })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)


    if (!formData.name || !formData.email) {
      setError('Name and email are required')
      return
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }


    if ((formData.role === 'Admin' || formData.role === 'Manager') && !canCreateAdminOrManager) {
      setError('Only Admins can create Admin or Manager roles')
      return
    }

    try {

      const skillsArray = formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
        : undefined

      if (formData.useInvite) {
        const result = await inviteUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department || undefined,
          skills: skillsArray,
          sendEmail: formData.sendEmail,
        }).unwrap()

        if (result.success && result.data) {
          setSuccess(true)
          const data = result.data
          if (data.inviteToken || data.inviteUrl) {
            setInviteResult({
              inviteToken: data.inviteToken,
              inviteUrl: data.inviteUrl,
            })
          } else if (data.id) {
            setTimeout(() => {
              router.push(`/teams/${data.id}`)
            }, 2000)
          }
        }
      } else {
        const result = await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          role: formData.role,
          department: formData.department || undefined,
          skills: skillsArray,
        }).unwrap()

        if (result.success && result.data) {
          const data = result.data
          if (data.id) {
            setSuccess(true)
            setTimeout(() => {
              router.push(`/teams/${data.id}`)
            }, 2000)
          }
        }
      }
    } catch (err: any) {
      setError(
        err.data?.message ||
        err.data?.error ||
        'Failed to create team member. Please try again.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
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

        <Card className="max-w-2xl border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    {error}
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
                        setFormData({
                          name: '',
                          email: '',
                          password: '',
                          role: 'Member',
                          department: '',
                          skills: '',
                          sendEmail: true,
                          useInvite: false,
                        })
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="email" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@example.com"
                    className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                </div>

                
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.useInvite}
                      onChange={(e) => setFormData({ ...formData, useInvite: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">Use invite flow (email invitation)</span>
                  </label>
                  <p className="text-xs text-muted-foreground ml-6">
                    {formData.useInvite
                      ? 'User will receive an email invitation to set up their account. Password will be auto-generated.'
                      : 'Create user directly with optional password.'}
                  </p>
                </div>

                
                {!formData.useInvite && (
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password (Optional)
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave empty to generate random password"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      If left empty, a random password will be generated and should be shared with the user.
                    </p>
                  </div>
                )}

                
                {formData.useInvite && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sendEmail}
                        onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Send invitation email
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      If unchecked, you'll receive an invite link to share manually.
                    </p>
                  </div>
                )}

                
                <div className="space-y-2 group">
                  <label htmlFor="role" className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Briefcase className="h-4 w-4" />
                    Role <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as 'Admin' | 'Manager' | 'Member' })
                    }
                    required
                    disabled={!canCreateAdminOrManager && (formData.role === 'Admin' || formData.role === 'Manager')}
                  >
                    <SelectTrigger id="role" className="transition-all">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">👤 Member</SelectItem>
                      {canCreateAdminOrManager && (
                        <>
                          <SelectItem value="Manager">👔 Manager</SelectItem>
                          <SelectItem value="Admin">👑 Admin</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
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
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Engineering, Design, etc."
                    className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                
                <div className="space-y-2 md:col-span-2 group">
                  <label htmlFor="skills" className="text-sm font-semibold group-hover:text-primary transition-colors">
                    Skills
                  </label>
                  <Input
                    id="skills"
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, Node.js, TypeScript (comma-separated)"
                    className="transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    Enter skills separated by commas
                  </p>
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
                      {formData.useInvite ? 'Sending Invite...' : 'Creating...'}
                    </span>
                  ) : success ? (
                    'Done!'
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      {formData.useInvite ? 'Send Invitation' : 'Create Team Member'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

