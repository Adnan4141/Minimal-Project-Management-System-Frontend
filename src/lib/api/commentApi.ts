import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface Comment {
  id: string
  content: string
  taskId: string
  userId: string
  parentId?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  parent?: {
    id: string
    content: string
    user: {
      id: string
      name: string
    }
  }
  replies?: Comment[]
}

export interface CreateCommentRequest {
  content: string
  taskId: string
  parentId?: string
}

export const commentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskComments: builder.query<ApiResponse<Comment[]>, string>({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: 'Comment', id: `task-${taskId}` },
        'Comment',
      ],
    }),
    createComment: builder.mutation<ApiResponse<Comment>, CreateCommentRequest>({
      query: (data) => ({
        url: '/comments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Comment', id: `task-${taskId}` },
        'Comment',
        'Task',
      ],
    }),
    updateComment: builder.mutation<ApiResponse<Comment>, { id: string; content: string }>({
      query: ({ id, content }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),
    deleteComment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Comment'],
    }),
  }),
})

export const {
  useGetTaskCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi

