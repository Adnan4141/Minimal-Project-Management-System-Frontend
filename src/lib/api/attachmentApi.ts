import { apiSlice } from './apiSlice'
import type { ApiResponse } from '@/types/api'

export interface Attachment {
  id: string
  filename: string
  fileUrl: string
  fileType: string
  fileSize: number
  taskId: string
  uploadedById?: string
  uploadedAt: string
  uploadedBy?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface CreateAttachmentRequest {
  taskId: string
  filename: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export const attachmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskAttachments: builder.query<ApiResponse<Attachment[]>, string>({
      query: (taskId) => `/attachments/task/${taskId}`,
      providesTags: (result, error, taskId) => [
        { type: 'Attachment', id: `task-${taskId}` },
        'Attachment',
      ],
    }),
    uploadAttachment: builder.mutation<ApiResponse<Attachment>, { taskId: string; file: File }>({
      query: ({ taskId, file }) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('taskId', taskId)
        
        return {
          url: '/attachments/upload',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Attachment', id: `task-${taskId}` },
        'Attachment',
        'Task',
      ],
    }),
    createAttachment: builder.mutation<ApiResponse<Attachment>, CreateAttachmentRequest>({
      query: (data) => ({
        url: '/attachments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Attachment', id: `task-${taskId}` },
        'Attachment',
        'Task',
      ],
    }),
    deleteAttachment: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/attachments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Attachment', 'Task'],
    }),
  }),
})

export const {
  useGetTaskAttachmentsQuery,
  useUploadAttachmentMutation,
  useCreateAttachmentMutation,
  useDeleteAttachmentMutation,
} = attachmentApi

