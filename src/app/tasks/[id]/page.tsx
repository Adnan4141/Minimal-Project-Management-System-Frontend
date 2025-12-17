'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useCreateTaskMutation,
  type Task,
} from '@/lib/api/taskApi'
import {
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
} from '@/lib/api/commentApi'
import {
  useGetTaskTimeLogsQuery,
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useDeleteTimeLogMutation,
  type TimeLog,
} from '@/lib/api/timelogApi'
import {
  useGetTaskAttachmentsQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
  type Attachment,
} from '@/lib/api/attachmentApi'
import { useAuth } from '@/hooks/useAuth'
import { Modal } from '@/components/ui/modal'
import { ArrowLeft, MessageSquare, Clock, User, Calendar, Edit2, Trash2, Activity, Paperclip, Plus, X, FileText, Image, File, CheckCircle2, Circle, Check, XCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  const { user } = useAuth()
  const { data, isLoading } = useGetTaskByIdQuery(taskId)
  const { data: commentsData, refetch: refetchComments } = useGetTaskCommentsQuery(taskId)
  const { data: timeLogsData, refetch: refetchTimeLogs } = useGetTaskTimeLogsQuery(taskId)
  const [updateTask] = useUpdateTaskMutation()
  const [createTask] = useCreateTaskMutation()
  const [createComment] = useCreateCommentMutation()
  const [createTimeLog] = useCreateTimeLogMutation()
  const [updateTimeLog] = useUpdateTimeLogMutation()
  const [deleteTimeLog] = useDeleteTimeLogMutation()
  const [uploadAttachment, { isLoading: isUploadingAttachment }] = useUploadAttachmentMutation()
  const [deleteAttachment] = useDeleteAttachmentMutation()

  const { data: attachmentsData, refetch: refetchAttachments } = useGetTaskAttachmentsQuery(taskId)

  const [commentText, setCommentText] = useState('')
  const [timeLogHours, setTimeLogHours] = useState('')
  const [timeLogDate, setTimeLogDate] = useState(new Date().toISOString().split('T')[0])
  const [timeLogDesc, setTimeLogDesc] = useState('')
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [subtaskDescription, setSubtaskDescription] = useState('')
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false)
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false)
  const [submissionNotes, setSubmissionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const task = data?.data
  const comments = commentsData?.data || []
  const timeLogs = timeLogsData?.data?.timeLogs || []
  const totalHoursLogged = timeLogsData?.data?.totalHours || 0
  const attachments = attachmentsData?.data || []
  const activities = task?.activities || []
  const subtasks = task?.subtasks || []

  // Calculate submission history - count how many times task was submitted for review
  const submissionHistory = activities
    .filter(
      (activity) => 
        activity.type === 'status_changed' && 
        activity.metadata?.newStatus === 'Review'
    )
    .map((activity) => {
      // Calculate if this submission was on time or late
      let submissionStatus = null
      if (task?.dueDate) {
        const submissionDate = new Date(activity.createdAt)
        const dueDate = new Date(task.dueDate)
        const diffTime = submissionDate.getTime() - dueDate.getTime()
        
        if (diffTime <= 0) {
          // Submitted on time
          submissionStatus = { onTime: true, message: 'On Time Submitted' }
        } else {
          // Submitted late
          const diffMinutes = Math.floor(diffTime / (1000 * 60))
          const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          
          let lateMessage = ''
          if (diffDays > 0) {
            lateMessage = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} late`
          } else if (diffHours > 0) {
            lateMessage = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} late`
          } else {
            lateMessage = `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} late`
          }
          
          submissionStatus = { onTime: false, message: lateMessage }
        }
      }
      
      return {
        ...activity,
        submissionStatus,
      }
    })
  const submissionCount = submissionHistory.length

  // Get all status change activities for timeline
  const statusChangeActivities = activities
    .filter((activity) => activity.type === 'status_changed')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // Calculate if task is late and by how much (for current status)
  const calculateLateStatus = () => {
    if (!task?.dueDate) return null
    
    const dueDate = new Date(task.dueDate)
    const now = new Date()
    const diffTime = now.getTime() - dueDate.getTime()
    
    if (diffTime <= 0) {
      // On time
      return { onTime: true, message: 'On Time' }
    }
    
    // Late
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Format the late status message
    let lateMessage = ''
    if (diffDays > 0) {
      lateMessage = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} late`
    } else if (diffHours > 0) {
      lateMessage = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} late`
    } else {
      lateMessage = `${diffMinutes} ${diffMinutes === 1 ? 'min' : 'mins'} late`
    }
    
    return {
      onTime: false,
      days: diffDays,
      hours: diffHours,
      minutes: diffMinutes,
      totalHours: diffHours,
      message: lateMessage,
    }
  }

  const lateStatus = calculateLateStatus()
  
  // Calculate submission status for the most recent submission (when task is in Review)
  // This shows if the submission was on time or late based on when it was submitted
  const currentSubmissionStatus = task?.status === 'Review' && submissionHistory.length > 0
    ? submissionHistory[submissionHistory.length - 1].submissionStatus
    : null

  const handleStatusChange = async (newStatus: 'ToDo' | 'InProgress' | 'Review' | 'Done') => {
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: newStatus,
      }).unwrap()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to update task status'
      setStatusError(errorMessage)
      console.error('Failed to update task status:', error)
    }
  }

  const handleSubmitForReview = async () => {
    if (!task) return
    
    setIsSubmitting(true)
    setStatusError('')
    
    try {
      // Update task status to Review
      await updateTask({
        id: taskId,
        status: 'Review',
      }).unwrap()

      // If submission notes provided, create a comment
      if (submissionNotes.trim()) {
        await createComment({
          taskId,
          content: `**Task Submission Notes:**\n\n${submissionNotes}`,
        }).unwrap()
        refetchComments()
      }

      // Close modal and reset
      setIsSubmissionModalOpen(false)
      setSubmissionNotes('')
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to submit task for review'
      setStatusError(errorMessage)
      console.error('Failed to submit task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveTask = async () => {
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: 'Done',
      }).unwrap()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to approve task'
      setStatusError(errorMessage)
      console.error('Failed to approve task:', error)
    }
  }

  const handleRejectTask = async () => {
    setStatusError('')
    try {
      await updateTask({
        id: taskId,
        status: 'InProgress',
      }).unwrap()
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Failed to reject task'
      setStatusError(errorMessage)
      console.error('Failed to reject task:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    try {
      await createComment({
        taskId,
        content: commentText,
      }).unwrap()
      setCommentText('')
      refetchComments()
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeLogHours || parseFloat(timeLogHours) <= 0) return

    try {
      await createTimeLog({
        taskId,
        hours: parseFloat(timeLogHours),
        date: timeLogDate,
        description: timeLogDesc || undefined,
      }).unwrap()
      setTimeLogHours('')
      setTimeLogDesc('')
      setTimeLogDate(new Date().toISOString().split('T')[0])
      refetchTimeLogs()
    } catch (error) {
      console.error('Failed to log time:', error)
    }
  }

  const handleOpenEditModal = (log: TimeLog) => {
    setEditingLog(log)
    setTimeLogHours(log.hours.toString())
    setTimeLogDate(new Date(log.date).toISOString().split('T')[0])
    setTimeLogDesc(log.description || '')
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingLog(null)
    setTimeLogHours('')
    setTimeLogDesc('')
    setTimeLogDate(new Date().toISOString().split('T')[0])
  }

  const handleUpdateTimeLog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editingLog || !timeLogHours || parseFloat(timeLogHours) <= 0) return

    try {
      await updateTimeLog({
        id: editingLog.id,
        hours: parseFloat(timeLogHours),
        date: timeLogDate,
        description: timeLogDesc || undefined,
      }).unwrap()
      handleCloseEditModal()
      refetchTimeLogs()
    } catch (error) {
      console.error('Failed to update time log:', error)
    }
  }

  const handleDeleteTimeLog = async () => {
    if (!deleteLogId) return

    try {
      await deleteTimeLog(deleteLogId).unwrap()
      setDeleteLogId(null)
      refetchTimeLogs()
    } catch (error) {
      console.error('Failed to delete time log:', error)
    }
  }

  const canEditTimeLog = (log: TimeLog) => {
    return log.userId === user?.id || user?.role === 'Admin' || user?.role === 'Manager'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed')
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    try {
      await uploadAttachment({
        taskId,
        file: selectedFile,
      }).unwrap()
      setSelectedFile(null)
      refetchAttachments()
    } catch (error) {
      console.error('Failed to upload attachment:', error)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      await deleteAttachment(attachmentId).unwrap()
      refetchAttachments()
    } catch (error) {
      console.error('Failed to delete attachment:', error)
    }
  }

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subtaskTitle.trim() || !task?.sprintId) return

    setIsCreatingSubtask(true)
    try {
      await createTask({
        title: subtaskTitle,
        description: subtaskDescription || undefined,
        sprintId: task.sprintId,
        parentTaskId: taskId,
        status: 'ToDo',
        priority: task.priority,
      }).unwrap()
      setSubtaskTitle('')
      setSubtaskDescription('')
    } catch (error) {
      console.error('Failed to create subtask:', error)
    } finally {
      setIsCreatingSubtask(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Task not found</p>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800'
      case 'InProgress': return 'bg-blue-100 text-blue-800'
      case 'Review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canUpdateStatus = user?.id === task.creatorId || 
    task.assignees?.some(a => a.user.id === user?.id) ||
    user?.role === 'Admin' || user?.role === 'Manager'

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager'
  const canApproveReview = task.status === 'Review' && isManagerOrAdmin
  const canMoveToDone = task.status === 'Review' ? isManagerOrAdmin : canUpdateStatus
  const isAssignedUser = task.assignees?.some(a => a.user.id === user?.id) || false
  const canSubmitForReview = isAssignedUser && 
    (task.status === 'ToDo' || task.status === 'InProgress') &&
    user?.role !== 'Admin' && user?.role !== 'Manager'

  const progressPercentage = task.status === 'Done' ? 100 : 
    task.status === 'Review' ? 75 :
    task.status === 'InProgress' ? 50 : 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{task.title}</h1>
              <p className="text-muted-foreground">
                {task.sprint?.project?.title} • {task.sprint?.title}
              </p>
            </div>
          </div>
          {canUpdateStatus && (
            <div className="flex flex-col items-end gap-2">
              {statusError && (
                <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive max-w-md">
                  {statusError}
                </div>
              )}
              <div className="flex items-center gap-2">
                {task.status === 'Review' && !isManagerOrAdmin && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Awaiting Manager Approval
                  </Badge>
                )}
                <Select
                  value={task.status}
                  onValueChange={(value) => handleStatusChange(value as any)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ToDo">To Do</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem 
                      value="Done" 
                      disabled={!canMoveToDone}
                    >
                      Done {task.status === 'Review' && !isManagerOrAdmin ? '(Requires Approval)' : ''}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
       
       
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-2 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Task Progress</CardTitle>
                  <CardDescription className="mt-0.5">Track your task completion status</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-base font-bold px-4 py-1.5 border-2">
                {progressPercentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <div className="space-y-8">
             
              <div>
                 
              </div>
             
             <div className="relative px-2">
                <div className="absolute top-8 left-8 right-8 h-1 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full" />
                <div 
                  className="absolute top-8 left-8 h-1 bg-gradient-to-r from-green-500 via-green-400 to-primary rounded-full transition-all duration-700 ease-out shadow-lg shadow-green-500/30"
                  style={{ 
                    width: task.status === 'Done' ? 'calc(100% - 4rem)' : 
                           task.status === 'Review' ? 'calc(75% - 2rem)' : 
                           task.status === 'InProgress' ? 'calc(50% - 1rem)' : '0%'
                  }}
                />
                <div className="relative flex items-start justify-between">
                  {[
                    { status: 'ToDo', label: 'To Do', icon: Circle, color: 'gray' },
                    { status: 'InProgress', label: 'In Progress', icon: Clock, color: 'blue' },
                    { status: 'Review', label: 'Review', icon: MessageSquare, color: 'yellow' },
                    { status: 'Done', label: 'Done', icon: CheckCircle2, color: 'green' },
                  ].map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = task.status === step.status
                    const isCompleted = 
                      step.status === 'InProgress' && (task.status === 'Review' || task.status === 'Done') ||
                      step.status === 'Review' && task.status === 'Done' ||
                      step.status === 'Done' && task.status === 'Done'

                    return (
                      <div key={step.status} className="flex flex-col items-center flex-1 relative z-10">
                        <div className="flex flex-col items-center w-full">
                          <div
                            className={`
                              relative flex items-center justify-center w-16 h-16 rounded-full border-[3px] transition-all duration-500 bg-background shadow-lg
                              ${isCompleted 
                                ? 'border-green-500 text-green-500 shadow-green-500/40 scale-110' 
                                : isActive 
                                ? 'border-primary text-primary ring-4 ring-primary/30 shadow-primary/40 scale-110' 
                                : 'border-muted-foreground/20 text-muted-foreground shadow-none'
                              }
                            `}
                          >
                            {isCompleted ? (
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-inner">
                                <CheckCircle2 className="h-8 w-8 text-white drop-shadow-sm" />
                              </div>
                            ) : (
                              <StepIcon className={`h-8 w-8 ${isActive ? 'animate-pulse' : ''}`} />
                            )}
                          
                          </div>
                          <div className="mt-5 text-center w-full space-y-2">
                            <p
                              className={`
                                text-sm font-bold tracking-wide
                                ${isActive 
                                  ? 'text-primary' 
                                  : isCompleted 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-muted-foreground'
                                }
                              `}
                            >
                              {step.label}
                            </p>
                            {isActive && (
                              <Badge 
                                className="text-xs font-semibold border-2 border-primary text-primary bg-primary/10 px-3 py-0.5 shadow-sm"
                              >
                                Active
                              </Badge>
                            )}
                            {isCompleted && !isActive && (
                              <Badge 
                                className="text-xs font-semibold border-2 border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-0.5 shadow-sm"
                              >
                                ✓ Done
                              </Badge>
                            )}
                            {!isActive && !isCompleted && (
                              <div className="h-5" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submission History Section */}
              <div className="pt-6 border-t border-dashed">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Submission History</span>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {submissionCount} {submissionCount === 1 ? 'Submission' : 'Submissions'}
                    </Badge>
                  </div>
                  
                  {submissionCount > 0 ? (
                    <div className="space-y-3">
                      {submissionHistory.map((submission, index) => (
                        <div
                          key={submission.id}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-primary/10"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {submission.user?.name || 'Unknown User'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                submitted for review
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(submission.createdAt)}
                            </p>
                            {submission.metadata?.oldStatus && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Status changed from <span className="font-medium">{submission.metadata.oldStatus}</span> to <span className="font-medium text-yellow-600 dark:text-yellow-400">Review</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No submissions yet. This task hasn't been submitted for review.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-dashed">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-semibold text-foreground">Overall Progress</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">{progressPercentage}</span>
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-secondary rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 transition-all duration-700 ease-out rounded-full shadow-lg"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>

              {task.status === 'Review' && canApproveReview && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-full bg-primary/10">
                          <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-foreground">
                              Task Approval Required
                            </h3>
                            {currentSubmissionStatus && (
                              <Badge 
                                className={`font-semibold ${
                                  !currentSubmissionStatus.onTime
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700'
                                }`}
                              >
                                {currentSubmissionStatus.onTime ? (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    On Time Submitted
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" />
                                    {currentSubmissionStatus.message}
                                  </span>
                                )}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            This task has been submitted for review. As a {user?.role === 'Admin' ? 'Admin' : 'Manager'}, you can approve it to mark as Done or send it back for revisions.
                            {submissionCount > 0 && (
                              <span className="block mt-2 font-medium">
                                This is submission #{submissionCount} for this task.
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={handleApproveTask}
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                              size="lg"
                            >
                              <Check className="h-5 w-5" />
                              Approve & Mark as Done
                            </Button>
                            <Button
                              onClick={handleRejectTask}
                              variant="outline"
                              className="gap-2 border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              size="lg"
                            >
                              <XCircle className="h-5 w-5" />
                              Send Back for Revisions
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {task.status === 'Review' && !isManagerOrAdmin && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Awaiting Manager Approval
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      This task requires manager or admin approval to be marked as Done.
                    </p>
                  </div>
                </div>
              )}

              {canSubmitForReview && (
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-full bg-primary/10">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Ready to Submit?
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Submit this task for review. Managers and admins will review your work and approve it when complete.
                          </p>
                          <Button
                            onClick={() => setIsSubmissionModalOpen(true)}
                            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg"
                            size="lg"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            Submit for Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <Button type="submit" size="sm">Post Comment</Button>
                </form>

                
                <div className="space-y-4 pt-4 border-t">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-11 space-y-2 pl-4 border-l">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                                {reply.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">{reply.user.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDateTime(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs mt-1">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <form onSubmit={handleUploadAttachment} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!selectedFile || isUploadingAttachment}
                    >
                      {isUploadingAttachment ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="flex items-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supported: Images (JPEG, PNG, GIF, WebP) and PDF files. Max size: 10MB
                  </p>
                </form>

                
                <div className="space-y-2 pt-4 border-t">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(attachment.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:text-primary truncate block"
                          >
                            {attachment.filename}
                          </a>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(attachment.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(attachment.uploadedAt)}</span>
                            {attachment.uploadedBy && (
                              <>
                                <span>•</span>
                                <span>by {attachment.uploadedBy.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                        {(attachment.uploadedById === user?.id || user?.role === 'Admin' || user?.role === 'Manager') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attachments yet. Upload files to share with your team.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Subtasks ({subtasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <form onSubmit={handleCreateSubtask} className="space-y-2 p-4 border rounded-lg">
                  <Input
                    placeholder="Subtask title..."
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Subtask description (optional)..."
                    value={subtaskDescription}
                    onChange={(e) => setSubtaskDescription(e.target.value)}
                    rows={2}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!subtaskTitle.trim() || isCreatingSubtask}
                    className="w-full"
                  >
                    {isCreatingSubtask ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subtask
                      </>
                    )}
                  </Button>
                </form>

                
                <div className="space-y-2 pt-4 border-t">
                  {subtasks.map((subtask) => (
                    <Link
                      key={subtask.id}
                      href={`/tasks/${subtask.id}`}
                      className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{subtask.title}</h4>
                            <Badge className={`${getStatusColor(subtask.status)} capitalize`}>
                              {subtask.status}
                            </Badge>
                          </div>
                          {subtask.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {subtask.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {subtasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No subtasks yet. Break down this task into smaller subtasks.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Logged ({timeLogsData?.data?.totalHours.toFixed(1) || 0}h)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <form onSubmit={handleLogTime} className="space-y-2 p-4 border rounded-lg">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="Hours"
                      value={timeLogHours}
                      onChange={(e) => setTimeLogHours(e.target.value)}
                      required
                    />
                    <DatePickerInput
                      value={timeLogDate}
                      onChange={(date) => setTimeLogDate(date)}
                      placeholder="Select date"
                      required
                    />
                    <Button type="submit" size="sm">Log Time</Button>
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={timeLogDesc}
                    onChange={(e) => setTimeLogDesc(e.target.value)}
                  />
                </form>

                
                <div className="space-y-2 pt-4 border-t">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-semibold">
                            {log.hours}h
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.date)}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mb-1">{log.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          by {log.user.name} • {formatDateTime(log.loggedAt)}
                        </p>
                      </div>
                      {canEditTimeLog(log) && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(log)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteLogId(log.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {timeLogs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No time logged yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            
            {activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                          {activity.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {activity.user?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge className={`${getStatusColor(task.status)} capitalize`}>
                    {task.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Priority</p>
                  <Badge>{task.priority}</Badge>
                </div>
                {task.dueDate && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                )}
                {task.estimate && (
                  <div>
                    <p className="text-sm font-medium mb-1">Estimate</p>
                    <p className="text-sm text-muted-foreground">{task.estimate}h</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {task.assignees && task.assignees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Assignees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.assignees.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {assignment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{assignment.user.name}</p>
                          <p className="text-xs text-muted-foreground">{assignment.user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        
        <Modal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onConfirm={handleUpdateTimeLog}
          title="Edit Time Log"
          description="Update your time log entry"
          confirmText="Update"
          isLoading={false}
        >
          <form onSubmit={handleUpdateTimeLog} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Hours</label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={timeLogHours}
                  onChange={(e) => setTimeLogHours(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <DatePickerInput
                  value={timeLogDate}
                  onChange={(date) => setTimeLogDate(date)}
                  placeholder="Select date"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                value={timeLogDesc}
                onChange={(e) => setTimeLogDesc(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>
          </form>
        </Modal>

        
        <Modal
          isOpen={!!deleteLogId}
          onClose={() => setDeleteLogId(null)}
          onConfirm={handleDeleteTimeLog}
          title="Delete Time Log"
          description="Are you sure you want to delete this time log entry? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          isLoading={false}
        />

        {/* Task Submission Modal */}
        <Modal
          isOpen={isSubmissionModalOpen}
          onClose={() => {
            setIsSubmissionModalOpen(false)
            setSubmissionNotes('')
          }}
          onConfirm={handleSubmitForReview}
          title="Submit Task for Review"
          description="Submit this task for manager/admin review. You can add notes about what you've completed."
          confirmText={isSubmitting ? "Submitting..." : "Submit for Review"}
          cancelText="Cancel"
          isLoading={isSubmitting}
        >
          <div className="space-y-4">
            {/* Submission Count Badge */}
            {submissionCount > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    This task has been submitted <strong>{submissionCount} {submissionCount === 1 ? 'time' : 'times'}</strong> for review
                  </p>
                </div>
              </div>
            )}

            {/* Time Tracking Summary */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Time Logged</p>
                  <p className="text-lg font-bold text-primary">
                    {totalHoursLogged.toFixed(1)}h
                  </p>
                  {task?.estimate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated: {task.estimate}h
                      {totalHoursLogged > Number(task.estimate) && (
                        <span className="text-orange-600 dark:text-orange-400 ml-1">
                          (+{(totalHoursLogged - Number(task.estimate)).toFixed(1)}h over)
                        </span>
                      )}
                      {totalHoursLogged < Number(task.estimate) && (
                        <span className="text-green-600 dark:text-green-400 ml-1">
                          ({(Number(task.estimate) - totalHoursLogged).toFixed(1)}h remaining)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {task?.dueDate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Due Date Status</p>
                    {lateStatus ? (
                      <div>
                        <p className="text-lg font-bold text-destructive flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          {lateStatus.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          On Time
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(task.dueDate)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {timeLogs.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No time has been logged for this task yet.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Submission Notes <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Add any notes about your work, what you've completed, or any important information for reviewers..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These notes will be added as a comment and the task will be moved to Review status.
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Once submitted, managers and admins will review your work and can approve it to mark as Done or send it back for revisions.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

