import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getApiUrl } from '@/config'
import type { RootState } from '../store'

const baseQuery = fetchBaseQuery({
  baseUrl: getApiUrl(),
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    let token = (getState() as RootState).auth.accessToken
    
    if (!token && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('accessToken')
      if (storedToken) {
        token = storedToken
      }
    }
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    

    if (!headers.get('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return headers
  },
})

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {

  if (args.body instanceof FormData && args.headers) {
    args.headers.delete('Content-Type')
  }
  
  let result = await baseQuery(args, api, extraOptions)
  

  if (result?.error?.status === 401 || result?.error?.status === 403) {

    if (args.url === '/auth/refresh' || args.url === '/auth/login' || args.url === '/auth/register') {

      return result
    }
    

    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    )
    
    if (refreshResult.data && !refreshResult.error) {
      const { accessToken } = refreshResult.data as { accessToken: string }
      api.dispatch({
        type: 'auth/setAccessToken',
        payload: accessToken,
      })
      

      result = await baseQuery(args, api, extraOptions)
    } else {

      api.dispatch({ type: 'auth/logout' })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')


        window.location.href = '/login'
      }
    }
  }
  
  return result
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Project',
    'Sprint',
    'Task',
    'Comment',
    'TimeLog',
    'Attachment',
    'Report',
  ],
  endpoints: () => ({}),
})

