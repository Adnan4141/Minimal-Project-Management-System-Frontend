'use client'

import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Button } from '@/components/ui/button'
import { initializeFacebookSDK, loginWithFacebook } from '@/lib/oauth/facebook'
import { config } from '@/config'

interface OAuthButtonsProps {
  onSuccess: (provider: 'google' | 'facebook', token: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function OAuthButtons({ onSuccess, onError, disabled = false }: OAuthButtonsProps) {
  const [isFacebookReady, setIsFacebookReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (config.oauth.facebook.appId) {
      initializeFacebookSDK(
        () => {
          setIsFacebookReady(true)
        },
        (error) => {
          onError?.(error.message)
        }
      )
    }
  }, [onError])

  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse?.credential) {
      setIsLoading(true)
      onSuccess('google', credentialResponse.credential)
    } else {
      onError?.('No credential received from Google')
    }
  }

  const handleGoogleError = () => {
    onError?.('Google Sign-In failed. Please try again.')
  }

  const handleFacebookClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isFacebookReady) {
      onError?.('Facebook Sign-In is not ready. Please wait...')
      return
    }

    setIsLoading(true)
    loginWithFacebook(
      (accessToken) => {
        setIsLoading(false)
        onSuccess('facebook', accessToken)
      },
      (error) => {
        setIsLoading(false)
        onError?.(error.message)
      }
    )
  }

  const hasOAuth = config.oauth.google.clientId || config.oauth.facebook.appId

  if (!hasOAuth) {
    return null
  }

  useEffect(() => {
    if (config.oauth.google.clientId) {
      const style = document.createElement('style')
      style.textContent = `
        div[id*="google-login"] {
          width: 100% !important;
        }
        div[id*="google-login"] > div {
          width: 100% !important;
          max-width: 100% !important;
        }
      `
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-2 w-full">
      {config.oauth.google.clientId && (
        <div 
          className={`w-full ${disabled || isLoading ? 'pointer-events-none opacity-50' : ''}`}
          style={{ width: '100%', minWidth: '100%' }}
        >
          <div 
            style={{ 
              width: '100%', 
              minWidth: '100%', 
              display: 'flex', 
              justifyContent: 'stretch',
            }}
            className="w-full"
          >
            <div 
              style={{ 
                width: '100%', 
                flex: '1 1 100%',
                minWidth: 0
              }}
              className="w-full"
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                shape="rectangular"
                theme="outline"
                size="large"
                text="continue_with"
                width="100%"
              />
            </div>
          </div>
        </div>
      )}

      {config.oauth.facebook.appId && (
        <div className="w-full" style={{ width: '100%' }}>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleFacebookClick}
            disabled={disabled || isLoading || !isFacebookReady}
            style={{ width: '100%' }}
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {isLoading ? 'Loading...' : 'Continue with Facebook'}
          </Button>
        </div>
      )}
    </div>
  )
}



