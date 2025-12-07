import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface Sprint {
  id: string
  title: string
  sprintNumber: number
  startDate: string
  endDate: string
  description?: string
  projectId: string
  creatorId: string
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    title: string
    client?: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  tasks?: Array<{
    id: string
    title: string
    description?: string
    status: string
    priority: string
    estimate?: number
    dueDate?: string
    createdAt: string
    updatedAt: string
    assignees?: Array<{
      id: string
      userId: string
      assignedAt: string
      user: {
        id: string
        name: string
        email: string
      }
    }>
    creator?: {
      id: string
    }
  }>
  stats?: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    progressPercentage: number
  }
}

export interface CreateSprintRequest {
  title: string
  startDate: string
  endDate: string
  description?: string
  projectId: string
}

export interface UpdateSprintRequest extends Partial<Omit<CreateSprintRequest, 'projectId'>> {
  id: string
}

export const sprintApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSprints: builder.query<ApiResponse<Sprint[]>, { projectId: string }>({
      query: ({ projectId }) => ({
        url: '/sprints',
        params: { projectId },
      }),
      providesTags: ['Sprint'],
    }),
    getSprintById: builder.query<ApiResponse<Sprint>, string>({
      query: (id) => `/sprints/${id}`,
      providesTags: (result, error, id) => [{ type: 'Sprint', id }],
    }),
    createSprint: builder.mutation<ApiResponse<Sprint>, CreateSprintRequest>({
      query: (data) => ({
        url: '/sprints',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sprint', 'Project'],
    }),
    updateSprint: builder.mutation<ApiResponse<Sprint>, UpdateSprintRequest>({
      query: ({ id, ...data }) => ({
        url: `/sprints/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sprint', id }, 'Sprint'],
    }),
    deleteSprint: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/sprints/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sprint', 'Project'],
    }),
  }),
})

export const {
  useGetSprintsQuery,
  useGetSprintByIdQuery,
  useCreateSprintMutation,
  useUpdateSprintMutation,
  useDeleteSprintMutation,
} = sprintApi

