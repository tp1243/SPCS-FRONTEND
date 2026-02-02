import { useEffect, useState } from 'react'
import { FaGoogle, FaApple, FaGithub } from 'react-icons/fa'

const API_URL = (import.meta.env.VITE_API_URL as string) || 'https://smart-police-complaint-system.onrender.com/api'

type Providers = { google: boolean; github: boolean; apple: boolean }

export default function SocialAuth() {
  const [providers, setProviders] = useState<Providers>({ google: true, github: true, apple: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/oauth/providers`).then((r) => r.json())
        setProviders({ google: !!res.google, github: !!res.github, apple: !!res.apple })
      } catch {
        // Fallback defaults
        setProviders({ google: true, github: true, apple: false })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const startAuth = (provider: 'google' | 'github' | 'apple') => {
    window.location.href = `${API_URL}/auth/${provider}`
  }

  return (
    <div className="social-auth">
      <div className="divider"><span>OR</span></div>
      <div className={`social-buttons ${loading ? 'loading' : ''}`}>
        <button className="btn social google" aria-label="Continue with Google" data-provider="google" disabled={!providers.google} onClick={() => startAuth('google')}>
          <FaGoogle /> <span className="provider-label">Continue with Google</span>
        </button>
        <button className="btn social github" aria-label="Continue with GitHub" data-provider="github" disabled={!providers.github} onClick={() => startAuth('github')}>
          <FaGithub /> <span className="provider-label">Continue with GitHub</span>
        </button>
        <button className="btn social apple" aria-label="Continue with Apple" data-provider="apple" disabled={!providers.apple} onClick={() => startAuth('apple')} title={!providers.apple ? 'Apple Sign In not configured' : ''}>
          <FaApple /> <span className="provider-label">Continue with Apple</span>
        </button>
      </div>
    </div>
  )
}