import { useEffect, useState } from 'react'
import { FaGoogle, FaApple, FaGithub } from 'react-icons/fa'

function resolveApiUrl() {
  try {
    const lsRaw = typeof window !== 'undefined' ? ((localStorage.getItem('apiResolved') || localStorage.getItem('apiBaseOverride') || '')).trim() : ''
    const envRaw = ((import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_API_BASE_URL as string) || '').trim()
    const invalid = (v: string) => /smart-police-complaint-system\.onrender\.com/i.test(v || '')
    const ls = invalid(lsRaw) ? '' : lsRaw
    const envBase = invalid(envRaw) ? '' : envRaw
    const raw = ls || envBase
    let base = raw || (typeof window !== 'undefined'
      ? (window.location.hostname.includes('spcs-frontend.vercel.app') ? 'https://spcs-backend.onrender.com/api' : `${window.location.origin}/api`)
      : '/api')
    base = base.replace(/\/$/, '')
    return base.endsWith('/api') ? base : `${base}/api`
  } catch {
    return '/api'
  }
}

type Providers = { google: boolean; github: boolean; apple: boolean }

export default function SocialAuth() {
  const [providers, setProviders] = useState<Providers>({ google: true, github: true, apple: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const API_URL = resolveApiUrl()
        const res = await fetch(`${API_URL}/oauth/providers`).then((r) => r.json())
        setProviders({ google: !!res.google, github: !!res.github, apple: !!res.apple })
      } catch {
        setProviders({ google: false, github: false, apple: false })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const startAuth = (provider: 'google' | 'github' | 'apple') => {
    const API_URL = resolveApiUrl()
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
