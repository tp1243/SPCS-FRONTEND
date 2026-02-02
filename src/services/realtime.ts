import { io, Socket } from 'socket.io-client'

function getSocketBaseUrl() {
  try {
    const lsResolved = typeof window !== 'undefined' ? (localStorage.getItem('apiResolved') || localStorage.getItem('apiBaseOverride') || '') : ''
    const envBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.VITE_API_BASE_URL as string) || ''
    const raw = (lsResolved && lsResolved.trim()) ? lsResolved : envBase
    const fallback = (typeof window !== 'undefined' && !import.meta.env.PROD) ? 'http://localhost:5175/api' : 'https://smart-police-complaint-system.onrender.com/api'
    const base = (raw.trim() ? raw.trim() : fallback)
    return base.replace(/\/api$/, '')
  } catch {
    return 'https://smart-police-complaint-system.onrender.com'
  }
}

export type SocketRole = 'user' | 'police'

export function connectRealtime(role: SocketRole, token: string): Socket {
  let base = getSocketBaseUrl()
  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('http://')) {
      base = base.replace(/^http:\/\//, 'https://')
    }
  } catch {}
  const socket = io(base, {
    transports: ['websocket', 'polling'],
    timeout: 8000,
    reconnection: true,
    reconnectionAttempts: 8,
    autoConnect: true,
    path: '/socket.io',
    query: { role, token },
  })
  return socket
}