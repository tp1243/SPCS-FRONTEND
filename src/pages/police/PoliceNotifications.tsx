import { useEffect, useState } from 'react'
import { FiBell, FiSearch, FiCheck, FiRefreshCw, FiX } from 'react-icons/fi'
import { policeApi } from '../../services/police'
import { connectRealtime } from '../../services/realtime'
import type { PoliceNotificationItem } from '../../types'
import { useNotificationSound } from '../../components/useNotificationSound'
import '../../notifications.css'

type Props = { token: string }

export default function PoliceNotifications({ token }: Props) {
  const [notifications, setNotifications] = useState<PoliceNotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [q, setQ] = useState<string>('')
  const sound = useNotificationSound({ volume: 0.85, cooldownMs: 0 })

  useEffect(() => {
    let active = true
    try { sound.setEnabled(true); sound.prime() } catch {}
    const socket = connectRealtime('police', token)
    socket.on('police:new_complaint', (payload: { message: string; complaintId?: string; createdAt?: string }) => {
      setNotifications((prev) => [
        { _id: String(Date.now()), message: payload.message, read: false, createdAt: payload.createdAt || new Date().toISOString(), complaintId: payload.complaintId || undefined, station: '' },
        ...prev,
      ])
      sound.play()
    })
    ;(async () => {
      try {
        const res = await policeApi.listNotifications(token)
        if (active) setNotifications(res.notifications)
        try { socket.connect() } catch {}
      } catch (err: any) {
        
      } finally {
        if (active) setLoading(false)
      }
    })()
    const id = setInterval(() => {
      policeApi.listNotifications(token).then((res) => setNotifications(res.notifications)).catch(() => {})
    }, 10000)
    return () => { active = false; clearInterval(id); socket.disconnect() }
  }, [token, sound])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    try {
      const r = await policeApi.markNotificationRead(token, id)
      setNotifications(prev => prev.map(n => n._id === id ? r.notification : n))
    } catch (err: any) {
      setError(err.message || 'Failed to mark as read')
    }
  }

  async function markAllRead() {
    try {
      const r = await policeApi.markAllNotificationsRead(token)
      setNotifications(r.notifications)
    } catch (err: any) {
      setError(err.message || 'Failed to clear notifications')
    }
  }

  const filtered = notifications.filter(n => {
    const okFilter = filter === 'all' ? true : !n.read
    const okQuery = q.trim() === '' ? true : (n.message.toLowerCase().includes(q.trim().toLowerCase()))
    return okFilter && okQuery
  })

  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><FiBell /> Notifications & Updates</h3>
          <span className="badge" title="Unread count">{unreadCount} Unread</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn ghost" onClick={() => { setLoading(true); policeApi.listNotifications(token).then(r => { setNotifications(r.notifications); setLoading(false) }).catch(() => setLoading(false)) }}><FiRefreshCw /> Refresh</button>
          <button className="btn" onClick={markAllRead}><FiCheck /> Mark all read</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div className="search modern" aria-label="Search notifications" style={{ flex: 1 }}>
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search updates" />
          {q && <button className="clear-btn" onClick={() => setQ('')} title="Clear"><FiX /></button>}
        </div>
        <div className="filters" style={{ display: 'flex', gap: 8 }}>
          <span className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</span>
          <span className={`pill ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <div className="muted">Loading notifications…</div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => (
            <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`}>
              <div className="left">
                <div className="title">UPDATE</div>
                <div>{n.message}</div>
                <div className="meta">{new Date(n.createdAt || '').toLocaleString()}</div>
              </div>
              <div className="right">
                {!n.read && <button className="btn sm" onClick={() => markRead(n._id)}><FiCheck /> Mark read</button>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="muted">No notifications to show.</div>}
        </div>
      )}
    </div>
  )
}