import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface TimeLog {
  id: string
  hours: number
  description?: string
  date: string
  taskId: string
  userId: string
  loggedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  task?: {
    id: string
    title: string
  }
}

export interface CreateTimeLogRequest {
  hours: number
  description?: string
  date: string
  taskId: string
}

export interface UpdateTimeLogRequest {
  id: string
  hours?: number
  description?: string
  date?: string
}

export const timelogApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskTimeLogs: builder.query<ApiResponse<{ timeLogs: TimeLog[]; totalHours: number }>, string>({
      query: (taskId) => `/timelogs/task/${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: 'TimeLog', id: `task-${taskId}` },
        'TimeLog',
      ],
    }),
    getUserTimeLogs: builder.query<
      ApiResponse<{ timeLogs: TimeLog[]; totalHours: number }>,
      { userId?: string; projectId?: string }
    >({
      query: (params) => ({
        url: '/timelogs/user',
        params,
      }),
      providesTags: ['TimeLog'],
    }),
    createTimeLog: builder.mutation<ApiResponse<TimeLog>, CreateTimeLogRequest>({
      query: (data) => ({
        url: '/timelogs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'TimeLog', id: `task-${taskId}` },
        'TimeLog',
        'Task',
        'Report',
      ],
    }),
    updateTimeLog: builder.mutation<ApiResponse<TimeLog>, UpdateTimeLogRequest>({
      query: ({ id, ...data }) => ({
        url: `/timelogs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['TimeLog', 'Task', 'Report'],
    }),
    deleteTimeLog: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/timelogs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TimeLog', 'Task', 'Report'],
    }),
  }),
})

export const {
  useGetTaskTimeLogsQuery,
  useGetUserTimeLogsQuery,
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useDeleteTimeLogMutation,
} = timelogApi

