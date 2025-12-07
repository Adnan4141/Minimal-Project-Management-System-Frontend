import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { logout as logoutAction, setCredentials } from '@/lib/slices/authSlice'
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
} from '@/lib/api/authApi'
import { useEffect } from 'react'

export function useAuth() {
  const dispatch = useAppDispatch()
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.auth)
  
  const [login, { isLoading: isLoggingIn }] = useLoginMutation()
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [logoutApi] = useLogoutMutation()
  const { data: meData, isLoading: isLoadingMe, refetch: refetchMe } = useGetMeQuery(undefined, {
    skip: !isAuthenticated || !accessToken,
  })

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ email, password }).unwrap()
      if (result.success && result.data) {
        dispatch(setCredentials(result.data))
        // Refetch user data to get the latest profile information including avatar
        setTimeout(() => {
          refetchMe()
        }, 100)
        return { success: true }
      }
      return { success: false, error: result.message || 'Login failed' }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Login failed',
      }
    }
  }

  const handleRegister = async (userData: {
    email: string
    password: string
    name: string
    role?: 'Admin' | 'Manager' | 'Member'
    department?: string
    skills?: string[]
  }) => {
    try {
      const result = await register(userData).unwrap()
      if (result.success && result.data) {
        dispatch(setCredentials(result.data))
        // Refetch user data to get the latest profile information
        setTimeout(() => {
          refetchMe()
        }, 100)
        return { success: true }
      }
      return { success: false, error: result.message || 'Registration failed' }
    } catch (error: any) {
      return {
        success: false,
        error: error.data?.message || error.message || 'Registration failed',
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      dispatch(logoutAction())
    }
  }

  // Update user data when getMe query returns fresh data
  useEffect(() => {
    if (meData?.success && meData.data && isAuthenticated && accessToken) {
      // Only update if the data is different to avoid unnecessary updates
      const currentUser = user
      const newUser = meData.data
      if (
        !currentUser ||
        currentUser.avatar !== newUser.avatar ||
        currentUser.name !== newUser.name ||
        currentUser.email !== newUser.email ||
        currentUser.department !== newUser.department ||
        currentUser.isActive !== newUser.isActive ||
        JSON.stringify(currentUser.skills || []) !== JSON.stringify(newUser.skills || [])
      ) {
        dispatch(setCredentials({
          user: newUser,
          accessToken: accessToken,
        }))
      }
    }
  }, [meData?.success, meData?.data, isAuthenticated, accessToken, user?.avatar, user?.name, user?.email, user?.department, user?.skills, dispatch])

  const isAdmin = user?.role === 'Admin'
  const isManager = user?.role === 'Manager'
  const isMember = user?.role === 'Member'
  const isAdminOrManager = isAdmin || isManager

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading: isLoggingIn || isRegistering || isLoadingMe,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAdmin,
    isManager,
    isMember,
    isAdminOrManager,
  }
}

