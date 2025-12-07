'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from '@/lib/api/userApi'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, UserPlus, Mail, Building2, Briefcase, Save } from 'lucide-react'
import Link from 'next/link'

export default function EditTeamMemberPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string
  const { user, isAdminOrManager } = useAuth()
  const { data, isLoading } = useGetUserByIdQuery(memberId)
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Member' as 'Admin' | 'Manager' | 'Member',
    department: '',
    skills: '',
    isActive: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const member = data?.data

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        role: member.role || 'Member',
        department: member.department || '',
        skills: member.skills?.join(', ') || '',
        isActive: member.isActive ?? true,
      })
    }
  }, [member])

  if (!isAdminOrManager && user?.id !== memberId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to edit this team member.</p>
          <Link href={`/teams/${memberId}`}>
            <Button variant="outline" className="mt-4">
              Back to Member Details
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        </div>
      </DashboardLayout>
    )
  }

  if (!member) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Team member not found</p>
          <Link href="/teams">
            <Button variant="outline" className="mt-4">
              Back to Teams
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const canEditRole = isAdminOrManager && user?.id !== memberId
  const canEditActive = isAdminOrManager

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

    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
        : undefined

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department || undefined,
        skills: skillsArray,
      }

      if (canEditRole) {
        updateData.role = formData.role
      }

      if (canEditActive) {
        updateData.isActive = formData.isActive
      }

      await updateUser({
        id: memberId,
        ...updateData,
      }).unwrap()

      setSuccess(true)
      setTimeout(() => {
        router.push(`/teams/${memberId}`)
      }, 1500)
    } catch (err: any) {
      setError(
        err.data?.message ||
        err.data?.error ||
        'Failed to update team member. Please try again.'
      )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center gap-4">
          <Link href={`/teams/${memberId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Team Member</h1>
            <p className="text-muted-foreground">Update team member information</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Team Member Information
            </CardTitle>
            <CardDescription>
              Update the details for this team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
                  Team member updated successfully! Redirecting...
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>

                
                {canEditRole && (
                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Role <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value as 'Admin' | 'Manager' | 'Member' })
                      }
                      required
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Member">Member</SelectItem>
                        {user?.role === 'Admin' && (
                          <>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                
                <div className="space-y-2">
                  <label htmlFor="department" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </label>
                  <Input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Engineering, Design, etc."
                  />
                </div>

                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="skills" className="text-sm font-medium">
                    Skills
                  </label>
                  <Input
                    id="skills"
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="React, Node.js, TypeScript (comma-separated)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter skills separated by commas
                  </p>
                </div>

                
                {canEditActive && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Active Account</span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      Inactive accounts cannot log in
                    </p>
                  </div>
                )}
              </div>

              
              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Link href={`/teams/${memberId}`}>
                  <Button type="button" variant="outline" disabled={isUpdating}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isUpdating || success}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Updating...' : success ? 'Updated!' : 'Update Team Member'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

