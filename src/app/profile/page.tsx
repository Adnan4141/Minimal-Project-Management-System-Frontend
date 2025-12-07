'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateUserMutation, useUploadAvatarMutation } from '@/lib/api/userApi'
import { useChangePasswordMutation } from '@/lib/api/authApi'
import { useGetMeQuery } from '@/lib/api/authApi'
import { User, Camera, Save, Lock, X } from 'lucide-react'
import { useAppDispatch } from '@/lib/hooks'
import { setCredentials } from '@/lib/slices/authSlice'

export default function ProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { data: meData, refetch: refetchMe } = useGetMeQuery()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    department: '',
    skills: [] as string[],
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (meData?.data) {
      const userData = meData.data
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        department: userData.department || '',
        skills: userData.skills || [],
      })
      if (userData.avatar) {
        setAvatarPreview(userData.avatar)
      }
    }
  }, [meData])

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !profileData.skills.includes(skillInput.trim())) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, avatar: 'Please select an image file' }))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: 'Image size must be less than 5MB' }))
        return
      }
      setSelectedFile(file)
      setErrors((prev) => ({ ...prev, avatar: '' }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!selectedFile) return

    setErrors((prev) => ({ ...prev, avatar: '' }))
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const result = await uploadAvatar(formData).unwrap()
      if (result.data) {
        const currentState = (dispatch as any).getState?.()?.auth
        dispatch(setCredentials({ 
          user: result.data, 
          accessToken: currentState?.accessToken || '' 
        }))
        setSuccessMessage('Avatar updated successfully!')
        setSelectedFile(null)
        refetchMe()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        avatar: error?.data?.message || 'Failed to upload avatar',
      }))
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    if (!user?.id) return

    try {
      const result = await updateUser({
        id: user.id,
        name: profileData.name,
        email: profileData.email,
        department: profileData.department || undefined,
        skills: profileData.skills,
      }).unwrap()

      if (result.data) {
        const currentState = (dispatch as any).getState?.()?.auth
        dispatch(setCredentials({ 
          user: result.data, 
          accessToken: currentState?.accessToken || '' 
        }))
        setSuccessMessage('Profile updated successfully!')
        refetchMe()
        setTimeout(() => setSuccessMessage(''), 3000)
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to update profile'
      if (errorMessage.includes('email')) {
        setErrors((prev) => ({ ...prev, email: errorMessage }))
      } else {
        setErrors((prev) => ({ ...prev, general: errorMessage }))
      }
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: 'Passwords do not match',
      }))
      return
    }

    if (passwordData.newPassword.length < 6) {
      setErrors((prev) => ({
        ...prev,
        newPassword: 'Password must be at least 6 characters',
      }))
      return
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap()

      setSuccessMessage('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to change password'
      if (errorMessage.includes('Current password')) {
        setErrors((prev) => ({ ...prev, currentPassword: errorMessage }))
      } else {
        setErrors((prev) => ({ ...prev, password: errorMessage }))
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {successMessage && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {errors.general && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{errors.general}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <CardTitle>Profile Information</CardTitle>
                </div>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleProfileChange('name', e.target.value)}
                      required
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="department" className="text-sm font-medium">
                      Department
                    </label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => handleProfileChange('department', e.target.value)}
                      placeholder="e.g., Engineering, Design, Marketing"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="skills" className="text-sm font-medium">
                      Skills
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSkill()
                          }
                        }}
                        placeholder="Add a skill and press Enter"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSkill}
                        disabled={!skillInput.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {profileData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profileData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium">
                      Current Password
                    </label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-destructive">{errors.currentPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      New Password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-destructive">{errors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm New Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <CardTitle>Profile Picture</CardTitle>
                </div>
                <CardDescription>Upload a new profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-32 w-32 rounded-full object-cover border-4 border-primary"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary">
                        <User className="h-16 w-16 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    {errors.avatar && (
                      <p className="text-sm text-destructive mt-2">{errors.avatar}</p>
                    )}
                  </div>

                  {selectedFile && (
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="w-full"
                    >
                      {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-sm font-medium capitalize">{user?.role}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {meData?.data?.createdAt
                      ? new Date(meData.data.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

