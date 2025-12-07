import { apiSlice } from './apiSlice'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export interface Project {
  id: string
  title: string
  client: string
  description?: string
  startDate: string
  endDate: string
  budget?: number
  status: 'planned' | 'active' | 'completed' | 'archived'
  thumbnail?: string
  creatorId: string
  managerId?: string
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    name: string
    email: string
  }
  manager?: {
    id: string
    name: string
    email: string
  }
  stats?: {
    totalTasks: number
    completedTasks: number
    inProgressTasks?: number
    tasksRemaining?: number
    progressPercentage: number
  }
}

export interface CreateProjectRequest {
  title: string
  client: string
  description?: string
  startDate: string
  endDate: string
  budget?: number
  status?: 'planned' | 'active' | 'completed' | 'archived'
  thumbnail?: string
  managerId?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string
}

export interface ProjectFilters {
  page?: number
  limit?: number
  status?: 'planned' | 'active' | 'completed' | 'archived'
  client?: string
  search?: string
}

export interface ProjectsResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const projectApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query<
      ApiResponse<ProjectsResponse>,
      ProjectFilters | void
    >({
      query: (filters = {}) => ({
        url: '/projects',
        params: filters,
      }),
      providesTags: ['Project'],
    }),
    getProjectById: builder.query<ApiResponse<Project>, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<ApiResponse<Project>, CreateProjectRequest>({
      query: (data) => ({
        url: '/projects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<ApiResponse<Project>, UpdateProjectRequest>({
      query: ({ id, ...data }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),
    deleteProject: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
})

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectApi

