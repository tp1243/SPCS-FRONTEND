import { useEffect, useState } from 'react'
import { FiBell, FiSearch, FiUser, FiMoon, FiSun } from 'react-icons/fi'
import BrandIcon from './BrandIcon'
import { notificationsApi } from '../services/notifications'
import type { NotificationItem } from '../types'
import { connectRealtime } from '../services/realtime'
import NotificationToast from './NotificationToast'
import { useI18n } from './i18n'

type Props = {
  token: string
  username: string
  onSearch: (q: string) => void
  onLogout: () => void
  onToggleSidebar: () => void
  sidebarOpen?: boolean
}

export default function DashboardNavbar({ token, username, onSearch, onLogout}: Props) {
  const [q, setQ] = useState('')
  const [openProfile, setOpenProfile] = useState(false)
  const [openBell, setOpenBell] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { lang, setLanguage, t } = useI18n()

  useEffect(() => {
    let active = true
    notificationsApi.list(token).then((res) => { if (active) setNotifications(res.notifications) }).catch(() => {})
    const id = setInterval(() => {
      notificationsApi.list(token).then((res) => setNotifications(res.notifications)).catch(() => {})
    }, 10000)
    // Real-time socket connection for user popups
    const socket = connectRealtime('user', token)
    socket.on('user:notification', (payload: { message: string; complaintId?: string; type?: string; createdAt?: string }) => {
      setToast({ message: payload.message, type: 'info' })
      setNotifications((prev) => [{
        _id: String(Date.now()),
        message: payload.message,
        type: payload.type || 'info',
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
        complaintId: payload.complaintId || undefined,
      }, ...prev])
    })
    return () => { active = false; clearInterval(id); socket.disconnect() }
  }, [token])

  useEffect(() => {
    function handler(e: Event) {
      const ce = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'info' }>
      const msg = ce.detail?.message || ''
      const type = ce.detail?.type || 'success'
      if (msg) setToast({ message: msg, type })
    }
    window.addEventListener('spcs:user-toast', handler as EventListener)
    return () => window.removeEventListener('spcs:user-toast', handler as EventListener)
  }, [])

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-theme'); else document.body.classList.remove('light-theme')
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch {} }, [lang])

  const unread = notifications.filter(n => !n.read).length

  return (
    <header className="dash-navbar">
      <div className="dash-left">
        <div className="logo" aria-label="Smart Police Complaint System (SPCS)">
          <BrandIcon height={24} className="logo-icon" title="SPCS logo" />
          <span className="logo-text">SPCS</span>
        </div>
      </div>
      <div className="dash-center">
        <div className="search">
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_placeholder')} />
          <button className="btn sm" onClick={() => onSearch(q)}>{t('search_btn')}</button>
        </div>
      </div>
      <div className="dash-right">
        <div className="welcome">{t('welcome', { username })}</div>
        {/* Mobile-only compact username */}
        <div className="user-label" aria-label="Username">{username}</div>
        <button className="btn toggle" onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <FiMoon /> : <FiSun />}
        </button>
        <select value={lang} onChange={(e) => setLanguage(e.target.value as any)} className="btn toggle" style={{ background: 'transparent', color: 'var(--text)', borderColor: '#24324a' }}>
          <option value="en">EN</option>
          <option value="hi">HI</option>
          <option value="mr">MR</option>
        </select>
        
        <div className="avatar" onClick={() => setOpenProfile(v => !v)}><FiUser /></div>
        <div className="bell" onClick={() => setOpenBell(v => !v)}>
          <FiBell />{unread > 0 && <span className="badge">{unread}</span>}
        </div>
        {openProfile && (
          <div className="dropdown">
            <button onClick={() => setOpenProfile(false)}>{t('profile_view')}</button>
            <button onClick={() => setOpenProfile(false)}>{t('profile_edit')}</button>
            <button onClick={() => setOpenProfile(false)}>{t('settings')}</button>
            <button onClick={onLogout}>{t('logout')}</button>
          </div>
        )}
        {openBell && (
          <div className="dropdown wide">
            {notifications.length === 0 ? <div className="muted">{t('no_updates')}</div> : notifications.map(n => (
              <div key={n._id} className={`notif ${n.read ? '' : 'unread'}`}>
                <div>{n.message}</div>
                <small>{new Date(n.createdAt || '').toLocaleString()}</small>
              </div>
            ))}
            <div className="actions"><button className="btn ghost" onClick={async () => { const r = await notificationsApi.markAllRead(token); setNotifications(r.notifications) }}>{t('clear_all')}</button></div>
          </div>
        )}
        {toast && <NotificationToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </header>
  )
}
