import { apiSlice } from './apiSlice'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

export interface User {
  id: string
  email: string
  name: string
  role: 'Admin' | 'Manager' | 'Member'
  department?: string
  skills?: string[]
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  _count?: {
    assignedTasks: number
    createdProjects: number
    createdTasks: number
  }
}

export interface CreateUserRequest {
  email: string
  password?: string
  name: string
  role: 'Admin' | 'Manager' | 'Member'
  department?: string
  skills?: string[]
}

export interface InviteUserRequest {
  email: string
  name: string
  role: 'Admin' | 'Manager' | 'Member'
  department?: string
  skills?: string[]
  sendEmail?: boolean
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {
  id: string
  isActive?: boolean
}

export interface UserFilters {
  page?: number
  limit?: number
  role?: 'Admin' | 'Manager' | 'Member'
  search?: string
  isActive?: string
}

export interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<UsersResponse>, UserFilters | void>({
      query: (filters = {}) => ({
        url: '/users',
        params: filters,
      }),
      providesTags: ['User'],
    }),
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<ApiResponse<User>, CreateUserRequest>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<ApiResponse<User>, UpdateUserRequest>({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getTeamMemberStats: builder.query<
      ApiResponse<{
        user: User
        statistics: {
          tasks: {
            total: number
            completed: number
            inProgress: number
            created: number
            completionRate: number
          }
          projects: {
            created: number
            managed: number
            total: number
          }
          time: {
            totalHours: number
            byProject: Array<{
              projectId: string
              projectTitle: string
              hours: number
            }>
          }
        }
        recentTasks: Array<{
          id: string
          title: string
          status: string
          priority: string
          project?: { id: string; title: string }
          sprint?: { id: string; title: string }
          assignedAt: string
        }>
        recentActivities: Array<{
          id: string
          type: string
          description: string
          task?: { id: string; title: string }
          createdAt: string
        }>
      }>,
      string
    >({
      query: (id) => `/users/${id}/stats`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    inviteUser: builder.mutation<
      ApiResponse<User & { inviteToken?: string; inviteUrl?: string }>,
      InviteUserRequest
    >({
      query: (data) => ({
        url: '/users/invite',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    uploadAvatar: builder.mutation<ApiResponse<User>, FormData>({
      query: (formData) => ({
        url: '/users/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
    activateUser: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    deactivateUser: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetTeamMemberStatsQuery,
  useInviteUserMutation,
  useUploadAvatarMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
} = userApi

