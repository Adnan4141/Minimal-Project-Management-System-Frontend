import { apiSlice } from './apiSlice'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export interface ActivityLog {
  id: string
  type: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'attachment_added' | 'time_logged' | 'completed'
  description?: string
  metadata?: any
  createdAt: string
  taskId?: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
  }
  projectId?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  estimate?: number
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'ToDo' | 'InProgress' | 'Review' | 'Done'
  dueDate?: string
  sprintId: string
  creatorId: string
  parentTaskId?: string
  createdAt: string
  updatedAt: string
  sprint?: {
    id: string
    title: string
    sprintNumber: number
    project?: {
      id: string
      title: string
    }
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  assignees?: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
  parentTask?: {
    id: string
    title: string
  }
  subtasks?: Task[]
  activities?: ActivityLog[]
  _count?: {
    comments: number
    attachments: number
    timeLogs: number
  }
}

export interface CreateTaskRequest {
  title: string
  description?: string
  estimate?: number
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: 'ToDo' | 'InProgress' | 'Review' | 'Done'
  dueDate?: string
  sprintId: string
  assigneeIds?: string[]
  parentTaskId?: string
}

export interface UpdateTaskRequest extends Partial<Omit<CreateTaskRequest, 'sprintId'>> {
  id: string
}

export interface TaskFilters {
  page?: number
  limit?: number
  projectId?: string
  sprintId?: string
  assigneeId?: string
  status?: 'ToDo' | 'InProgress' | 'Review' | 'Done'
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  search?: string
}

export interface TasksResponse {
  tasks: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const taskApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query<
      ApiResponse<TasksResponse>,
      TaskFilters | void
    >({
      query: (filters = {}) => ({
        url: '/tasks',
        params: filters,
      }),
      providesTags: ['Task'],
    }),
    getTaskById: builder.query<ApiResponse<Task>, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<ApiResponse<Task>, CreateTaskRequest>({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Task', 'Sprint', 'Project'],
    }),
    updateTask: builder.mutation<ApiResponse<Task>, UpdateTaskRequest>({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }, 'Task', 'Sprint', 'Project'],
    }),
    deleteTask: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task', 'Sprint', 'Project'],
    }),
  }),
})

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi

