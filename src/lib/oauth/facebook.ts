import { config } from '@/config'

declare global {
  interface Window {
    fbAsyncInit?: () => void
  }
}

export interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string
    userID: string
    expiresIn: number
  }
  status: 'connected' | 'not_authorized' | 'unknown'
}

export function initializeFacebookSDK(
  onReady?: () => void,
  onError?: (error: Error) => void
): void {
  if (!config.oauth.facebook.appId) {
    const error = new Error('Facebook OAuth is not configured')
    onError?.(error)
    return
  }


  if (window.FB) {
    onReady?.()
    return
  }


  if (document.querySelector('script[src*="connect.facebook.net"]')) {
    
    const checkInterval = setInterval(() => {
      if (window.FB) {
        clearInterval(checkInterval)
        onReady?.()
      }
    }, 100)
    return
  }


  window.fbAsyncInit = () => {
    if (!window.FB) {
      onError?.(new Error('Facebook SDK failed to load'))
      return
    }

    window.FB.init({
      appId: config.oauth.facebook.appId,
      cookie: true,
      xfbml: true,
      version: 'v18.0',
    })

    onReady?.()
  }

  const script = document.createElement('script')
  script.src = 'https://connect.facebook.net/en_US/sdk.js'
  script.async = true
  script.defer = true
  script.crossOrigin = 'anonymous'
  script.onload = () => {
    if (!window.FB) {
      onError?.(new Error('Facebook SDK failed to initialize'))
    }
  }
  script.onerror = () => {
    onError?.(new Error('Failed to load Facebook SDK script'))
  }
  document.head.appendChild(script)
}

export function loginWithFacebook(
  onSuccess: (accessToken: string) => void,
  onError?: (error: Error) => void
): void {
  if (!window.FB) {
    onError?.(new Error('Facebook SDK is not initialized'))
    return
  }

  window.FB.login(
    (response: FacebookLoginResponse) => {
      if (response.authResponse) {
        onSuccess(response.authResponse.accessToken)
      } else {
        onError?.(new Error('Facebook login failed: User cancelled or permission denied'))
      }
    },
    {
      scope: 'email,public_profile',
      return_scopes: true,
    }
  )
}

export function logoutFromFacebook(
  onSuccess?: () => void,
  onError?: (error: Error) => void
): void {
  if (!window.FB) {
    onError?.(new Error('Facebook SDK is not initialized'))
    return
  }

  window.FB.logout((response: any) => {
    if (response) {
      onSuccess?.()
    } else {
      onError?.(new Error('Facebook logout failed'))
    }
  })
}

export function getFacebookUserInfo(
  onSuccess: (userInfo: { id: string; name: string; email: string }) => void,
  onError?: (error: Error) => void
): void {
  if (!window.FB) {
    onError?.(new Error('Facebook SDK is not initialized'))
    return
  }

  window.FB.api('/me', { fields: 'id,name,email' }, (response: any) => {
    if (response && !response.error) {
      onSuccess({
        id: response.id,
        name: response.name,
        email: response.email || '',
      })
    } else {
      onError?.(new Error(response?.error?.message || 'Failed to get user info'))
    }
  })
}
