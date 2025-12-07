import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
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

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
}

if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('accessToken')
  const storedUser = localStorage.getItem('user')
  
  if (storedToken && storedUser) {
    initialState.accessToken = storedToken
    initialState.user = JSON.parse(storedUser)
    initialState.isAuthenticated = true
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload)
      }
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      }
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(state.user))
        }
      }
    },
  },
})

export const { setCredentials, setAccessToken, logout, updateUser } = authSlice.actions
export default authSlice.reducer

