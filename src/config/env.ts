
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  apiPrefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api',
  oauth: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    },
    facebook: {
      appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    },
  },
} as const

export const getApiUrl = (path: string = '') => {
  return `${config.apiUrl}${config.apiPrefix}${path}`
}

