export type AuthResponse = { token: string; user: { id: string; username: string; email: string } }
export type AuthPoliceResponse = { token: string; officer: { id: string; username: string; email: string; station: string } }
export type ProfileUser = { id: string; username: string; email: string; phone?: string; address?: string; avatarUrl?: string }

const apiBaseRaw = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_API_BASE_URL as string) || ''
let cachedApiBase: string | null = null

function normalizeBase(u: string) {
  const base = u.trim()
  if (!base) return ''
  const withoutSlash = base.replace(/\/$/, '')
  return withoutSlash.endsWith('/api') ? withoutSlash : `${withoutSlash}/api`
}

// Deprecated: health probing removed to avoid noisy console logs in dev

async function resolveApiBase(): Promise<string> {
  if (cachedApiBase) return cachedApiBase
  const storedRaw = typeof window !== 'undefined' ? (localStorage.getItem('apiResolved') || '').trim() : ''
  const overrideRaw = typeof window !== 'undefined' ? (localStorage.getItem('apiBaseOverride') || '').trim() : ''
  const envBase = (apiBaseRaw || '').trim()
  const isSuspended = /smart-police-complaint-system\.onrender\.com/i.test(envBase)
  const invalid = (v: string) => /smart-police-complaint-system\.onrender\.com/i.test(v || '')
  const stored = invalid(storedRaw) ? '' : storedRaw
  const override = invalid(overrideRaw) ? '' : overrideRaw
  const chosen =
    (stored || '') ||
    (override || '') ||
    ((!isSuspended && envBase) ? envBase : (typeof window !== 'undefined'
      ? (window.location.hostname.includes('spcs-frontend.vercel.app') ? 'https://spcs-backend.onrender.com' : window.location.origin)
      : 'http://localhost:5175'))
  cachedApiBase = normalizeBase(chosen)
  if (typeof window !== 'undefined') localStorage.setItem('apiResolved', cachedApiBase)
  return cachedApiBase
}

export async function request<T>(path: string, options: RequestInit): Promise<T> {
  const base = await resolveApiBase()
  const mergedHeaders = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const finalOptions: RequestInit = { ...options, headers: mergedHeaders }
  let keepalive = true
  try {
    const bodyStr = typeof finalOptions.body === 'string' ? finalOptions.body : ''
    if (bodyStr && bodyStr.length > 60000) keepalive = false
  } catch {}
  const timeoutMs = String(finalOptions.method || 'GET').toUpperCase() === 'GET' ? 15000 : 20000
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${base}${path}`, { ...finalOptions, keepalive, mode: 'cors', cache: 'no-store', signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Request failed: ${res.status}`)
    }
    return res.json()
  } catch (e: any) {
    clearTimeout(timer)
    const msg = e?.name === 'AbortError' ? 'Network timeout. Please try again.' : (e?.message || 'Network error')
    throw new Error(msg)
  }
}

export const api = {
  async register(username: string, email: string, password: string, phone?: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password, phone }) })
  },
  async registerBegin(username: string, email: string, password: string, phone?: string) {
    return request<{ ok: boolean }>('/auth/register/begin', { method: 'POST', body: JSON.stringify({ username, email, password, phone }) })
  },
  async registerVerify(username: string, email: string, password: string, otp: string, phone?: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register/verify-otp', { method: 'POST', body: JSON.stringify({ username, email, password, otp, phone }) })
  },
  async policeRegister(username: string, email: string, password: string, station: string): Promise<AuthPoliceResponse> {
    return request<AuthPoliceResponse>('/police/register', { method: 'POST', body: JSON.stringify({ username, email, password, station }) })
  },
  async policeLogin(email: string, password: string, station: string): Promise<AuthPoliceResponse> {
    return request<AuthPoliceResponse>('/police/login', { method: 'POST', body: JSON.stringify({ email, password, station }) })
  },
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async loginBegin(email: string, password: string) {
    return request<{ ok: boolean }>('/auth/login/begin', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async loginVerify(email: string, otp: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) })
  },
  async otpResend(email: string, purpose: 'register' | 'login') {
    return request<{ ok: boolean }>('/auth/otp/resend', { method: 'POST', body: JSON.stringify({ email, purpose }) })
  },
  // Removed OTP flows
  async profile(token: string) {
    return request<{ user: ProfileUser }>('/profile', { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async updateProfile(token: string, data: { username?: string; email?: string; phone?: string; address?: string; avatarUrl?: string }) {
    return request<{ user: ProfileUser }>('/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
  },
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    return request<{ ok: true }>('/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  },
  async deleteAccount(token: string, password: string) {
    return request<{ ok: true }>('/profile', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password }),
    })
  },
}

export const supportApi = {
  async faqsList(q?: string, category?: string) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    return request<{ faqs: Array<{ _id: string; question: string; answer: string; category: string; helpfulCount: number; notHelpfulCount: number }> }>(`/faqs?${params.toString()}`, { method: 'GET' })
  },
  async faqVote(token: string, id: string, helpful: boolean) {
    return request<{ ok: boolean; faq: { _id: string; helpfulCount: number; notHelpfulCount: number }; vote?: { faqId: string; userId: string; helpful: boolean } }>(`/faqs/${id}/vote`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ helpful }) })
  },
  async faqVotes(token: string) {
    return request<{ votes: Array<{ faqId: string; helpful: boolean }> }>(`/faqs/votes`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async createTicket(token: string, payload: { email: string; phone?: string; complaintId?: string; category: string; description: string; screenshotData?: string }) {
    return request<{ ok: boolean; ticket: any }>(`/support-tickets`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
  },
  async listTickets(token: string) {
    return request<{ tickets: any[] }>(`/support-tickets`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async chatList(token: string) {
    return request<{ messages: Array<{ _id: string; role: 'user' | 'assistant' | 'agent'; content: string; createdAt: string }> }>(`/chat/messages`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })
  },
  async chatSend(token: string, message: string, useAI: boolean = true) {
    return request<{ messages: any[] }>(`/chat/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ message, useAI }) })
  },
  async feedbackSubmit(payload: { rating: number; text?: string; anonymous?: boolean; userId?: string | null }) {
    return request<{ ok: boolean; feedback: any }>(`/feedback`, { method: 'POST', body: JSON.stringify(payload) })
  },
  async feedbackStats() {
    return request<{ average: number; count: number }>(`/feedback/stats`, { method: 'GET' })
  },
  async feedbackList() {
    return request<{ feedbacks: Array<{ id: string; username: string; text: string; rating: number; createdAt: string }> }>(`/feedback`, { method: 'GET' })
  },
  async supportContact(city?: string) {
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    return request<{ helplines: Array<{ label: string; number: string }>; email: string; hours: string; links: Record<string, string>; station: { address: string; mapUrl: string } }>(`/support/contact?${params.toString()}`, { method: 'GET' })
  },
}
