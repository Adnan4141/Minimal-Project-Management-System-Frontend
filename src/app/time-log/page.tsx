'use client'

import { useState } from 'react'
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
import { Modal } from '@/components/ui/modal'
import {
  useGetUserTimeLogsQuery,
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useDeleteTimeLogMutation,
  type TimeLog,
} from '@/lib/api/timelogApi'
import { useGetTasksQuery } from '@/lib/api/taskApi'
import { useAuth } from '@/hooks/useAuth'
import { Clock, Plus, Edit2, Trash2, Calendar, Filter, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { DatePickerInput } from '@/components/ui/date-picker'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function TimeLogPage() {
  const { user } = useAuth()
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)


  const [formData, setFormData] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    taskId: '',
  })

  const { data: timeLogsData, isLoading } = useGetUserTimeLogsQuery({
    userId: user?.id,
  })

  const { data: tasksData } = useGetTasksQuery({
    page: 1,
    limit: 100,
    assigneeId: user?.id,
  })

  const [createTimeLog, { isLoading: isCreating }] = useCreateTimeLogMutation()
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation()
  const [deleteTimeLog, { isLoading: isDeleting }] = useDeleteTimeLogMutation()

  const timeLogs = timeLogsData?.data?.timeLogs || []
  const totalHours = timeLogsData?.data?.totalHours || 0
  const tasks = tasksData?.data?.tasks || []

  const filteredLogs = timeLogs.filter((log) => {
    if (taskFilter !== 'all' && log.taskId !== taskFilter) return false
    
    if (dateFilter === 'custom') {
      if (startDate && new Date(log.date) < new Date(startDate)) return false
      if (endDate && new Date(log.date) > new Date(endDate)) return false
    } else if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0]
      if (new Date(log.date).toISOString().split('T')[0] !== today) return false
    } else if (dateFilter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      if (new Date(log.date) < weekAgo) return false
    } else if (dateFilter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      if (new Date(log.date) < monthAgo) return false
    }
    
    return true
  })


  const filteredTotal = filteredLogs.reduce((sum, log) => sum + Number(log.hours), 0)

  const handleOpenAddModal = () => {
    setFormData({
      hours: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      taskId: '',
    })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (log: TimeLog) => {
    setEditingLog(log)
    setFormData({
      hours: log.hours.toString(),
      description: log.description || '',
      date: new Date(log.date).toISOString().split('T')[0],
      taskId: log.taskId,
    })
    setIsAddModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setEditingLog(null)
    setFormData({
      hours: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      taskId: '',
    })
  }

  const handleSubmit = async () => {
    if (!formData.hours || parseFloat(formData.hours) <= 0 || !formData.taskId) {
      return
    }

    try {
      if (editingLog) {
        await updateTimeLog({
          id: editingLog.id,
          hours: parseFloat(formData.hours),
          description: formData.description || undefined,
          date: formData.date,
        }).unwrap()
      } else {
        await createTimeLog({
          taskId: formData.taskId,
          hours: parseFloat(formData.hours),
          description: formData.description || undefined,
          date: formData.date,
        }).unwrap()
      }
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save time log:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteLogId) return

    try {
      await deleteTimeLog(deleteLogId).unwrap()
      setDeleteLogId(null)
    } catch (error) {
      console.error('Failed to delete time log:', error)
    }
  }

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.date).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(log)
    return acc
  }, {} as Record<string, TimeLog[]>)

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Time Log</h1>
            <p className="text-muted-foreground">Track and manage your time entries</p>
          </div>
          <Button onClick={handleOpenAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Log Time
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">All time logged</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtered Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTotal.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Based on current filters</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
              <p className="text-xs text-muted-foreground">Time log entries</p>
            </CardContent>
          </Card>
        </div>

        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select
                  value={dateFilter}
                  onValueChange={setDateFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateFilter === 'custom' && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <DatePickerInput
                      value={startDate}
                      onChange={(date) => setStartDate(date)}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <DatePickerInput
                      value={endDate}
                      onChange={(date) => setEndDate(date)}
                      placeholder="Select end date"
                      minDate={startDate || undefined}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Task</label>
                <Select
                  value={taskFilter}
                  onValueChange={setTaskFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading time logs...</p>
          </div>
        ) : sortedDates.length > 0 ? (
          <div className="space-y-6">
            {sortedDates.map((date) => {
              const logs = groupedLogs[date]
              const dayTotal = logs.reduce((sum, log) => sum + Number(log.hours), 0)
              
              return (
                <Card key={date}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {formatDate(date)}
                        </CardTitle>
                        <CardDescription>
                          {logs.length} {logs.length === 1 ? 'entry' : 'entries'} • {dayTotal.toFixed(1)}h total
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-semibold">
                                {log.hours}h
                              </Badge>
                              {log.task && (
                                <Link
                                  href={`/tasks/${log.taskId}`}
                                  className="text-sm font-medium hover:underline"
                                >
                                  {log.task.title}
                                </Link>
                              )}
                            </div>
                            {log.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {log.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Logged at {formatDateTime(log.loggedAt)}
                            </p>
                          </div>
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No time logs found</h3>
              <p className="text-muted-foreground mb-4">
                {dateFilter !== 'all' || taskFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : "You haven't logged any time yet."}
              </p>
              <Button onClick={handleOpenAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Time Entry
              </Button>
            </CardContent>
          </Card>
        )}

        
        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleSubmit}
          title={editingLog ? 'Edit Time Log' : 'Log Time'}
          description={editingLog ? 'Update your time log entry' : 'Add a new time log entry'}
          confirmText={editingLog ? 'Update' : 'Log Time'}
          isLoading={isCreating || isUpdating}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Task</label>
              <Select
                value={formData.taskId}
                onValueChange={(value) => setFormData({ ...formData, taskId: value })}
                disabled={!!editingLog}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task:any) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Hours</label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <DatePickerInput
                  value={formData.date}
                  onChange={(date) => setFormData({ ...formData, date })}
                  placeholder="Select date"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>
          </div>
        </Modal>

        
        <Modal
          isOpen={!!deleteLogId}
          onClose={() => setDeleteLogId(null)}
          onConfirm={handleDelete}
          title="Delete Time Log"
          description="Are you sure you want to delete this time log entry? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  )
}

