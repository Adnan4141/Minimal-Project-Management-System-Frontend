
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string | Array<{ path: string; message: string }>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

