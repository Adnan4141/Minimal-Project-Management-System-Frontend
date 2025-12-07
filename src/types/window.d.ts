
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          prompt: () => void
        }
      }
    }
    FB?: {
      init: (config: {
        appId: string
        cookie: boolean
        xfbml: boolean
        version: string
      }) => void
      getLoginStatus: (callback: (response: {
        authResponse?: {
          accessToken: string
          userID: string
          expiresIn: number
        }
        status: 'connected' | 'not_authorized' | 'unknown'
      }) => void) => void
      login: (
        callback: (response: {
          authResponse?: {
            accessToken: string
            userID: string
            expiresIn: number
          }
          status: 'connected' | 'not_authorized' | 'unknown'
        }) => void,
        options?: { scope?: string; return_scopes?: boolean }
      ) => void
      logout: (callback: (response: any) => void) => void
      api: (path: string, params: any, callback: (response: any) => void) => void
    }
  }
}

export {}

