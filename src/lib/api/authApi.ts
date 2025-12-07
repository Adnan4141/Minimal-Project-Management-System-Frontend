import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: 'Admin' | 'Manager' | 'Member'
  department?: string
  skills?: string[]
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'Admin' | 'Manager' | 'Member'
    department?: string
    skills?: string[]
    avatar?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
  accessToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface OAuthRequest {
  provider: 'google' | 'facebook'
  idToken?: string
  accessToken?: string
}

export interface AcceptInviteRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    refreshToken: builder.mutation<ApiResponse<RefreshTokenResponse>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    getMe: builder.query<ApiResponse<AuthResponse['user']>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          // Update user data in Redux and localStorage when getMe succeeds
          if (data?.success && data.data) {
            const currentState = (dispatch as any).getState?.()?.auth
            if (currentState?.accessToken) {
              dispatch({
                type: 'auth/setCredentials',
                payload: {
                  user: data.data,
                  accessToken: currentState.accessToken,
                },
              })
            }
          }
        } catch (error: any) {
          if (error?.error?.status === 401) {
            dispatch({ type: 'auth/logout' })
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }
          }
        }
      },
    }),
    logout: builder.mutation<ApiResponse<void>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    oauth: builder.mutation<ApiResponse<AuthResponse>, OAuthRequest>({
      query: (data) => ({
        url: '/auth/oauth',
        method: 'POST',
        body: data,
      }),
    }),
    acceptInvite: builder.mutation<ApiResponse<AuthResponse>, AcceptInviteRequest>({
      query: (data) => ({
        url: '/auth/accept-invite',
        method: 'POST',
        body: data,
      }),
    }),
    changePassword: builder.mutation<ApiResponse<void>, ChangePasswordRequest>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useLogoutMutation,
  useOauthMutation,
  useAcceptInviteMutation,
  useChangePasswordMutation,
} = authApi

export { useOauthMutation as useOAuthMutation }

