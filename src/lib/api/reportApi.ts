import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface ProjectProgress {
  projectId: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  progressPercentage: number
  timeLogged: number
  tasksRemaining: number
}

export interface UserTimeSummary {
  userId: string
  totalHours: number
  tasksWorked: number
  projects: Array<{
    projectId: string
    hours: number
  }>
}

export interface DashboardStats {
  projects: {
    total: number
    active: number
  }
  users: {
    total: number
  }
  tasks: {
    total: number
    completed: number
    inProgress: number
  }
  timeLogged: {
    total: number
  }
}

export const reportApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjectProgress: builder.query<ApiResponse<ProjectProgress>, string>({
      query: (projectId) => `/reports/project/${projectId}/progress`,
      transformResponse: (response: ApiResponse<ProjectProgress>) => {
        return response
      },
      providesTags: (result, error, projectId) => [
        { type: 'Report', id: `project-${projectId}` },
      ],
    }),
    getUserTimeSummary: builder.query<
      ApiResponse<UserTimeSummary>,
      { userId?: string; projectId?: string }
    >({
      query: (params) => ({
        url: '/reports/user/time-summary',
        params,
      }),
      providesTags: ['Report'],
    }),
    getDashboardStats: builder.query<ApiResponse<DashboardStats>, void>({
      query: () => '/reports/dashboard',
      providesTags: ['Report'],
    }),
  }),
})

export const {
  useGetProjectProgressQuery,
  useGetUserTimeSummaryQuery,
  useGetDashboardStatsQuery,
} = reportApi

