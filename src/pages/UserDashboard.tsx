import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavbar from '../components/DashboardNavbar'
import DashboardSidebar from '../components/DashboardSidebar'
import ProfileSettings from './ProfileSettings'
import { lazy } from 'react'
const Analytics = lazy(() => import('../components/Analytics'))
import { complaintsApi } from '../services/complaints'
import { api, supportApi,  type ProfileUser } from '../services/api'
import { notificationsApi } from '../services/notifications'
import { connectRealtime } from '../services/realtime'
import { FiHelpCircle, FiMessageCircle, FiStar, FiSearch, FiChevronDown, FiChevronUp, FiThumbsUp, FiThumbsDown, FiLink, FiSend, FiX, FiFilter, FiBell, FiCheck, FiRefreshCw, FiMenu, FiMic } from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'
import type { Complaint, ComplaintStatus, NotificationItem } from '../types'
import { useNotificationSound } from '../components/useNotificationSound'
import { I18nProvider, useI18n } from '../components/i18n'
import '../notifications.css'

export default function UserDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState('overview')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [stats, setStats] = useState<Record<string, number>>({ Pending: 0, 'In Progress': 0, Solved: 0, 'Under Review': 0 })
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshSignal, setRefreshSignal] = useState(0)
  const notify = useNotificationSound({ volume: 0.85, cooldownMs: 0 })
  const firstPoll = useRef(true)
  const statusMapRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const onEnable = () => { notify.setEnabled(true); notify.prime() }
    const onDisable = () => { notify.setEnabled(false) }
    window.addEventListener('spcs:enable-sound', onEnable)
    window.addEventListener('spcs:disable-sound', onDisable)
    return () => {
      window.removeEventListener('spcs:enable-sound', onEnable)
      window.removeEventListener('spcs:disable-sound', onDisable)
    }
  }, [notify])

  useEffect(() => { try { notify.setEnabled(true); notify.prime() } catch {} }, [notify])

  const token = localStorage.getItem('token') || ''
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } })()

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return }
    ;(async () => {
      const results = await Promise.allSettled([
        api.profile(token),
        complaintsApi.listMine(token, { fields: 'summary', limit: 50 }),
        complaintsApi.stats(token),
      ])
      const pRes = results[0]
      const listRes = results[1]
      const statsRes = results[2]
      if (pRes.status === 'fulfilled') setProfile(pRes.value.user)
      if (listRes.status === 'fulfilled') {
        setComplaints(listRes.value.complaints)
        statusMapRef.current = Object.fromEntries(listRes.value.complaints.map((c: any) => [String(c._id || ''), String(c.status || '')]))
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats)
      const someSuccess = results.some(r => r.status === 'fulfilled')
      if (!someSuccess) setError('Network timeout. Please try again.')
      setLoading(false)
    })()
  }, [token])

  useEffect(() => {
    if (!token) return
    const socket = connectRealtime('user', token)
    socket.on('user:notification', (payload: { type?: string; complaintId?: string; status?: ComplaintStatus; createdAt?: string }) => {
      if (String(payload.type || '') === 'status_updated') {
        const cid = String(payload.complaintId || '')
        const st = (payload.status || 'Pending') as ComplaintStatus
        setComplaints(prev => prev.map(c => String(c._id || '') === cid ? { ...c, status: st, updatedAt: payload.createdAt || c.updatedAt } : c))
        const prevStatus = statusMapRef.current[cid]
        statusMapRef.current[cid] = st
        if (prevStatus && prevStatus !== st) notify.play()
        complaintsApi.stats(token).then(r => setStats(r.stats)).catch(() => {})
      }
    })
    socket.on('user:complaint_status', (payload: { id?: string; status?: ComplaintStatus; updatedAt?: string }) => {
      const cid = String(payload.id || '')
      const st = (payload.status || 'Pending') as ComplaintStatus
      setComplaints(prev => prev.map(c => String(c._id || '') === cid ? { ...c, status: st, updatedAt: payload.updatedAt || c.updatedAt } : c))
      const prevStatus = statusMapRef.current[cid]
      statusMapRef.current[cid] = st
      if (prevStatus && prevStatus !== st) notify.play()
      complaintsApi.stats(token).then(r => setStats(r.stats)).catch(() => {})
    })
    try { socket.connect() } catch {}
    return () => { try { socket.disconnect() } catch {} }
  }, [token, notify])

  // Poll for status changes and play a notification when a complaint status updates
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const list = await complaintsApi.listMine(token, { fields: 'summary', limit: 50 })
        const nextMap = Object.fromEntries(list.complaints.map(c => [String(c._id || ''), String(c.status || '')]))
        let changed = false
        for (const [cid, st] of Object.entries(nextMap)) {
          if (statusMapRef.current[cid] && statusMapRef.current[cid] !== st) { changed = true; break }
        }
        setComplaints(list.complaints)
        statusMapRef.current = nextMap
        if (!firstPoll.current && changed) notify.play()
        if (firstPoll.current) firstPoll.current = false
      } catch {
        // ignore transient poll errors
      }
    }, 30000)
    return () => clearInterval(id)
  }, [token, notify])

  const username = profile?.username || user?.username || 'User'

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login')
  }

  function handleSearch(q: string) {
    const norm = q.trim().toLowerCase()
    const filtered = complaints.filter(c =>
      c.title.toLowerCase().includes(norm) ||
      (c._id || '').toLowerCase().includes(norm) ||
      (c.status || '').toLowerCase().includes(norm)
    )
    setSection('my')
    setComplaints(filtered)
  }

  async function submitComplaint(payload: Complaint) {
    const { photoUrl, ...meta } = payload as any
    let res: any
    try {
      res = await complaintsApi.create(meta as any, token)
    } catch (err) {
      await new Promise(r => setTimeout(r, 600))
      res = await complaintsApi.create(meta as any, token)
    }
    setComplaints(prev => [res.complaint, ...prev])
    const statsPromise = complaintsApi.stats(token)
    if (photoUrl) {
      try {
        // Attempt photo attach, but do not fail the overall submission if it errors
        await complaintsApi.update(token, String(res.complaint._id), { photoUrl })
      } catch {}
    }
    const statsRes = await statsPromise.catch(() => null)
    if (statsRes?.stats) setStats(statsRes.stats)
    setRefreshSignal(v => v + 1)
    setSection('my')
    try {
      const st = res.complaint?.station || 'nearest station'
      const km = typeof res.complaint?.nearestDistanceKm === 'number' ? `${res.complaint.nearestDistanceKm.toFixed(1)} km` : ''
      const message = km ? `Your complaint submitted to ${st} (${km})` : `Your complaint submitted to ${st}`
      window.dispatchEvent(new CustomEvent('spcs:user-toast', { detail: { message, type: 'success' } }))
    } catch {}
  }

  let content: ReactNode
  if (loading) {
    content = <LoadingPanel />
  } else if (error) {
    content = <div className="panel error">{error}</div>
  } else {
    switch (section) {
      case 'overview':
        content = (<>
          <Overview stats={stats} complaints={complaints} />
          <AnalyticsSection token={token} refreshSignal={refreshSignal} />
        </>)
        break
      case 'new':
        content = <ComplaintForm onSubmit={submitComplaint} />
        break
      case 'my':
        content = <ComplaintsTable items={complaints} />
        break
      case 'track':
        content = <MapView items={complaints} />
        break
      case 'notifications':
        content = <NotificationsPanel token={token} />
        break
      case 'support':
        content = <SupportPanel token={token} profile={profile} />
        break
      case 'feedback':
        content = <SupportPanel token={token} profile={profile} defaultTab="feedback" />
        break
      case 'profile':
        content = <ProfileSettings />
        break
      default:
        content = <Overview stats={stats} complaints={complaints} />
    }
  }


  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <I18nProvider>
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashboardNavbar token={token} username={username} onSearch={handleSearch} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
      {/* Mobile-only hamburger placed after navbar, aligned left */}
      <MobileHamburgerButton sidebarOpen={sidebarOpen} onClick={() => setSidebarOpen(prev => !prev)} />
      <div className="dash-body">
        <DashboardSidebar active={section} onChange={(key) => { setSection(key); setSidebarOpen(false); }} />
        {/* Mobile overlay to close sidebar when open */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}
        <main className="dash-main">
          {content}
        </main>
      </div>
    </div>
    </I18nProvider>
  )
}

function LoadingPanel() {
  const { t } = useI18n()
  return <div className="panel"><div className="muted">{t('loading_dashboard')}</div></div>
}

function AnalyticsSection({ token, refreshSignal }: { token: string; refreshSignal?: number }) {
  const { t } = useI18n()
  return (
    <Suspense fallback={<div className="muted">{t('loading_analytics')}</div>}>
      <Analytics token={token} refreshSignal={refreshSignal} />
    </Suspense>
  )
}

function MobileHamburgerButton({ sidebarOpen, onClick }: { sidebarOpen: boolean; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <button className="mobile-hamburger" aria-label={sidebarOpen ? t('close_menu') : t('open_menu')} onClick={onClick}>
      {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}

function Overview({ stats, complaints }: { stats: Record<string, number>; complaints: Complaint[] }) {
  const { t } = useI18n()
  return (
    <div>
      <div className="grid stats">
        <StatCard label={t('overview_total')} value={complaints.length} />
        <StatCard label={t('overview_solved')} value={stats['Solved'] || 0} />
        <StatCard label={t('overview_pending')} value={stats['Pending'] || 0} />
        <StatCard label={t('overview_review')} value={stats['Under Review'] || 0} />
      </div>
      <div className="panel">
        <div className="muted">{t('overview_quick')}</div>
      </div>
    </div>
  )
}

function ComplaintsTable({ items }: { items: Complaint[] }) {
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [q, setQ] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const filtered = items
    .filter(c => (!statusFilter || c.status === statusFilter))
    .filter(c => !q || (c.title || '').toLowerCase().includes(q.toLowerCase()) || (c.description || '').toLowerCase().includes(q.toLowerCase()) || (c._id || '').includes(q))
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortBy === 'newest' ? db - da : da - db
    })
  if (items.length === 0) return <div className="panel"><div className="muted">{t('no_complaints_yet')}</div></div>
  return (
    <>
      <div>
        <div className="panel" style={{ marginBottom: 10 }}>
          <div className="table-toolbar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div className="search modern">
              <FiSearch />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('complaints_search_placeholder')} />
              {q && (
                <button className="clear-btn" onClick={() => setQ('')}>{t('clear')}</button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <div className="filters">
                <span className={`pill ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All</span>
                <span className={`pill ${statusFilter === 'Pending' ? 'active' : ''}`} onClick={() => setStatusFilter('Pending')}>Pending</span>
                <span className={`pill ${statusFilter === 'Under Review' ? 'active' : ''}`} onClick={() => setStatusFilter('Under Review')}>Under Review</span>
                <span className={`pill ${statusFilter === 'In Progress' ? 'active' : ''}`} onClick={() => setStatusFilter('In Progress')}>In Progress</span>
                <span className={`pill ${statusFilter === 'Solved' ? 'active' : ''}`} onClick={() => setStatusFilter('Solved')}>Solved</span>
              </div>
              <div className="sort">
                <FiFilter />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="table">
            <div className="thead">
            <div>{t('table_id')}</div><div>{t('table_title')}</div><div>{t('table_date')}</div><div>{t('table_status')}</div><div>{t('table_station')}</div><div>{t('table_actions')}</div>
          </div>
          {filtered.map((c) => {
            const distance = typeof c.nearestDistanceKm === 'number' ? `${c.nearestDistanceKm.toFixed(1)} km` : ''
            const filed = new Date(c.createdAt || '').toLocaleDateString()
            const station = c.station ? `${c.station}${distance ? ` (${distance})` : ''}` : '-'
            return (
              <div className="trow" key={c._id}>
                <div title={c._id}>{c._id?.slice(-6)}</div>
                <div className="title-cell" title={c.title}>
                  {c.photoUrl ? (
                    <img className="thumb" src={c.photoUrl} alt="complaint photo" />
                  ) : (
                    <span className="thumb placeholder" aria-hidden />
                  )}
                  <span className="title-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                </div>
                <div>{filed}</div>
                <div><StatusBadge status={(c.status as ComplaintStatus) || 'Pending'} /></div>
                <div title={station}>{station || t('unassigned')}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <DetailsModalButton complaint={c} />
                  <DownloadPdfButton complaint={c} />
                </div>
              </div>
            )
          })}
        </div>
        {/* Mobile cards view for complaints */}
        <div className="complaints-cards">
          {filtered.map((c) => (
            <div className="card complaint-card horizontal" key={c._id}>
              {/* Row 1: image + id + crime + station (single line) */}
              <div className="row-main">
                {c.photoUrl ? (
                  <img className="thumb" src={c.photoUrl} alt="complaint photo" />
                ) : (
                  <span className="thumb placeholder" aria-hidden />
                )}
                <span className="id" title={c._id}>#{c._id?.slice(-6)}</span>
                <span className="crime" title={c.type}>{c.type}</span>
                <span className="station" title={c.station || t('unassigned')}>{c.station || t('unassigned')}</span>
              </div>
              {/* Row 2: View Details + Status */}
              <div className="row-actions">
                <DetailsModalButton complaint={c} />
                <StatusBadge status={(c.status as ComplaintStatus) || 'Pending'} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`badge ${status.replace(/\s/g, '-').toLowerCase()}`}>{status}</span>
}

function DetailsModalButton({ complaint }: { complaint: Complaint }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  function renderDescription(text: string) {
    const lines = (text || '').split(/\r?\n/).filter(l => l.trim().length > 0)
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const linkify = (line: string) => line.split(urlRegex).map((chunk, idx) => {
      const isUrl = /^https?:\/\//.test(chunk)
      return isUrl ? <a key={idx} href={chunk} target="_blank" rel="noopener noreferrer">{chunk}</a> : <span key={idx}>{chunk}</span>
    })
    const nodes: React.ReactNode[] = []
    let list: string[] = []
    for (const l of lines) {
      if (/^[-*•]\s+/.test(l.trim())) {
        list.push(l.trim().replace(/^[-*•]\s+/, ''))
      } else {
        if (list.length) {
          nodes.push(<ul className="desc-list">{list.map((i, k) => <li key={`li-${k}`}>{linkify(i)}</li>)}</ul>)
          list = []
        }
        nodes.push(<p className="desc-paragraph">{linkify(l)}</p>)
      }
    }
    if (list.length) nodes.push(<ul className="desc-list">{list.map((i, k) => <li key={`li-${k}`}>{linkify(i)}</li>)}</ul>)
    return nodes
  }
  return (
    <>
      <button className="btn sm" onClick={() => setOpen(true)}>{t('view_details')}</button>
      {open && (
        <div className="modal">
          <div className="modal-body">
            <button className="icon-btn close" aria-label={t('close')} onClick={() => setOpen(false)}><FiX /></button>
            <h3>{complaint.title}</h3>
            <p><b>{t('type')}:</b> {complaint.type}</p>
            <div className="modal-desc">
              <div className="modal-desc-title">{t('description')}</div>
              {complaint.description?.trim() ? renderDescription(complaint.description) : <div className="muted">{t('no_description')}</div>}
            </div>
            <Timeline status={(complaint.status as ComplaintStatus) || 'Pending'} />
            {complaint.photoUrl && <img src={complaint.photoUrl} alt="evidence" style={{ maxWidth: '100%', borderRadius: 8 }} />}
            {complaint.location?.address && <p><b>{t('location')}:</b> {complaint.location.address}</p>}
            <p><b>{t('routed_station')}:</b> {complaint.station || t('unassigned')}{typeof complaint.nearestDistanceKm === 'number' ? ` (${complaint.nearestDistanceKm.toFixed(1)} km)` : ''}</p>
            <div className="actions">
              <button className="btn" onClick={() => setOpen(false)}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Timeline({ status }: { status: ComplaintStatus }) {
  const stages: ComplaintStatus[] = ['Pending', 'Under Review', 'In Progress', 'Solved']
  const idx = stages.indexOf(status)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
      {stages.map((s, i) => (
        <span key={s} className={`badge ${s.replace(/\s/g,'-').toLowerCase()}`} style={{ opacity: i <= idx ? 1 : 0.5 }}>{s}</span>
      ))}
    </div>
  )
}

function DownloadPdfButton({ complaint }: { complaint: Complaint }) {
  const { t } = useI18n()
  function download() {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF()
      doc.text('Smart Police Complaint System', 14, 16)
      doc.text(`Complaint ID: ${complaint._id || '-'}`, 14, 26)
      doc.text(`Title: ${complaint.title}`, 14, 36)
      doc.text(`Type: ${complaint.type}`, 14, 46)
      doc.text(`Status: ${complaint.status || 'Pending'}`, 14, 56)
      doc.text(`Station: ${complaint.station || 'Unassigned'}`, 14, 66)
      if (typeof complaint.nearestDistanceKm === 'number') doc.text(`Nearest distance: ${complaint.nearestDistanceKm.toFixed(1)} km`, 14, 76)
      doc.text('Description:', 14, 86)
      doc.text(complaint.description || '', 14, 96)
      doc.save(`complaint_${complaint._id || 'report'}.pdf`)
    })
  }
  return <button className="btn sm" onClick={download}>{t('download_pdf')}</button>
}

function ComplaintForm({ onSubmit }: { onSubmit: (payload: Complaint) => Promise<void> }) {
  const { t } = useI18n()
  const [form, setForm] = useState<Complaint>(() => {
    const d = localStorage.getItem('complaintDraft')
    if (d) {
      try {
        const parsed = JSON.parse(d)
        const cleaned: Complaint = {
          ...parsed,
          // Always start with lat/lng unset; user must click "Use my location"
          location: {
            ...(parsed.location || {}),
            lat: undefined,
            lng: undefined,
          },
        }
        return cleaned
      } catch {
        // Fallback to empty form if stored draft is malformed
        return { title: '', type: '', description: '', contact: '', location: { address: '' } } as any
      }
    }
    return { title: '', type: '', description: '', contact: '', location: { address: '' } } as any
  })
  const [, setFileName] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitStage, setSubmitStage] = useState<'idle' | 'submit' | 'upload' | 'finalize'>('idle')
  const [ok, setOk] = useState('')
  const [errors, setErrors] = useState<{ title?: string; type?: string; description?: string; contact?: string }>({})
  const [submitError, setSubmitError] = useState('')
  const [recognizing, setRecognizing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const lastFinalRef = useRef<string>('')
  const voiceSupported = useMemo(() => {
    try { return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) } catch { return false }
  }, [])
  const saveTimer = useRef<number | null>(null)
  useEffect(() => {
    try {
      if (saveTimer.current) { clearTimeout(saveTimer.current) }
      saveTimer.current = window.setTimeout(() => {
        try { localStorage.setItem('complaintDraft', JSON.stringify(form)) } catch {}
      }, 300)
    } catch {}
    return () => { if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null } }
  }, [form])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'complaintDraft' && typeof e.newValue === 'string') {
        try {
          const next = JSON.parse(e.newValue)
          setForm(prev => ({ ...prev, ...next }))
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    // Guard against very large files to avoid 413 on server
    const MAX_SIZE = 4 * 1024 * 1024 // 4MB
    if (f.size > MAX_SIZE) {
      setSubmitError('Image too large. Please select a file under 4MB.')
      e.target.value = ''
      return
    }
    setFileName(f.name)
    try {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxW = 1280
          const scale = Math.min(1, maxW / img.width)
          canvas.width = Math.round(img.width * scale)
          canvas.height = Math.round(img.height * scale)
          const ctx = canvas.getContext('2d')
          if (!ctx) { setSubmitError('Canvas unavailable'); return }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          let q = 0.75
          let url = canvas.toDataURL('image/jpeg', q)
          const est = (u: string) => { const b64 = u.split(',')[1] || ''; return Math.ceil((b64.length * 3) / 4) }
          while (est(url) > MAX_SIZE && q > 0.4) { q -= 0.15; url = canvas.toDataURL('image/jpeg', q) }
          if (est(url) > MAX_SIZE) { setSubmitError('Compressed image still too large. Try a smaller file.'); return }
          setForm(prev => ({ ...prev, photoUrl: url }))
        }
        img.src = String(reader.result)
      }
      reader.readAsDataURL(f)
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to process image')
    }
  }


  function toggleVoice() {
    setSubmitError('')
    if (!recognizing) {
      if (!voiceSupported) { setSubmitError('Voice input not supported on this device/browser'); return }
      try {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const r = new SR()
        recognitionRef.current = r
        r.lang = (navigator.language || 'en-IN')
        r.continuous = true
        r.interimResults = false
        r.onresult = (e: any) => {
          const idx = e.results.length - 1
          const res = e.results[idx]
          if (!res) return
          const transcript = String(res[0]?.transcript || '').trim().replace(/\s+/g, ' ')
          if (res.isFinal && transcript && transcript !== lastFinalRef.current) {
            lastFinalRef.current = transcript
            setForm(prev => ({ ...prev, description: prev.description ? `${prev.description} ${transcript}` : transcript }))
          }
        }
        r.onend = () => { setRecognizing(false) }
        r.onerror = () => { setRecognizing(false) }
        r.start()
        setRecognizing(true)
      } catch (err: any) {
        setSubmitError(err?.message || 'Failed to start voice input')
      }
    } else {
      try { recognitionRef.current?.stop() } catch {}
      setRecognizing(false)
    }
  }


  


  const [locating, setLocating] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'searching' | 'accurate' | 'inaccurate' | 'denied' | 'timeout' | 'unavailable' | 'outdated'>('idle');
  const [currAccuracy, setCurrAccuracy] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [visualLoc, setVisualLoc] = useState<{ lat: number; lng: number } | null>(null);
  const samplesRef = useRef<Array<{ lat: number; lng: number; accuracy: number; timestamp: number }>>([]);
  // Persist last good location to improve reliability when GPS is flaky
  const lastGoodStored = (() => { try { return JSON.parse(localStorage.getItem('lastGoodLoc') || 'null') } catch { return null } })();
  const lastGoodRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(lastGoodStored);
  const revGeoTimerRef = useRef<number | null>(null);
  const lastRevGeoRef = useRef<{ lat: number; lng: number } | null>(null);
  const [addressManual, setAddressManual] = useState(false)
  const lastAutoAddressRef = useRef<string>('')

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  function formatAddress(json: any) {
    const a = json?.address || {}
    const poi = json?.name || a.public_building || a.building || a.amenity || a.shop || ''
    const houseNo = a.house_number || a.block || ''
    const road = a.road || a.residential || a.pedestrian || a.footway || a.cycleway || a.path || ''
    const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.hamlet || a.estate || ''
    const city = a.city || a.town || a.village || a.city_district || a.county || ''
    const state = a.state || ''
    const postcode = a.postcode || ''
    const street = [houseNo, road].filter(Boolean).join(' ')
    const parts = [poi, street, neighbourhood].filter(Boolean).join(', ')
    const place = [city].filter(Boolean).join('')
    const tail = [state, postcode].filter(Boolean).join(' ')
    const display = [parts, place].filter(Boolean).join(', ')
    const full = [display, tail].filter(Boolean).join(', ')
    return full || json?.display_name || ''
  }

  async function reverseGeocode(lat: number, lng: number) {
    let addr: string = ''
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 12000)
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&namedetails=1&extratags=1`
      const res = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en-IN' }, signal: ctrl.signal })
      clearTimeout(t)
      if (res.ok) {
        const json = await res.json()
        addr = formatAddress(json)
      }
    } catch {}
    if (!addr) {
      try {
        const ctrl2 = new AbortController()
        const t2 = setTimeout(() => ctrl2.abort(), 12000)
        const url2 = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lng}`
        const res2 = await fetch(url2, { headers: { 'Accept-Language': navigator.language || 'en-IN' }, signal: ctrl2.signal })
        clearTimeout(t2)
        if (res2.ok) {
          const json2 = await res2.json()
          addr = formatAddress(json2)
        }
      } catch {}
    }
    const nearby = await buildNearbyString(lat, lng)
    const coordFallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    const baseAddr = addr || coordFallback
    const finalAddr = nearby ? `${baseAddr} • Nearby: ${nearby}` : baseAddr
    const isAddressBlank = !((form.location?.address || '').trim())
    if (finalAddr && finalAddr !== lastAutoAddressRef.current) {
      lastAutoAddressRef.current = finalAddr
      if (!addressManual || isAddressBlank) {
        setForm(prev => ({ ...prev, location: { ...(prev.location || {}), address: finalAddr } }))
      }
    }
  }

  function scheduleReverseGeocode(lat: number, lng: number) {
    const last = lastRevGeoRef.current;
    if (last && haversine(last.lat, last.lng, lat, lng) < 10) return;
    lastRevGeoRef.current = { lat, lng };
    if (revGeoTimerRef.current) { clearTimeout(revGeoTimerRef.current); revGeoTimerRef.current = null; }
    revGeoTimerRef.current = window.setTimeout(() => { reverseGeocode(lat, lng); }, 250);
  }

  async function buildNearbyString(lat: number, lng: number) {
    let elements: any[] = []
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 12000)
      const q = `[out:json][timeout:10];(node(around:450,${lat},${lng})["shop"];node(around:450,${lat},${lng})["amenity"="college"];node(around:450,${lat},${lng})["amenity"="university"];node(around:450,${lat},${lng})["amenity"="place_of_worship"];);out body;`
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (res.ok) {
        const json = await res.json()
        elements = Array.isArray(json?.elements) ? json.elements : []
      }
    } catch {}
    if (!elements.length) return ''
    let bestShop: any = null, bestShopD = Infinity
    let bestCollege: any = null, bestCollegeD = Infinity
    let bestTemple: any = null, bestTempleD = Infinity
    for (const el of elements) {
      const name = el?.tags?.name || ''
      const eLat = typeof el.lat === 'number' ? el.lat : (el?.center?.lat || null)
      const eLon = typeof el.lon === 'number' ? el.lon : (el?.center?.lon || null)
      if (name && typeof eLat === 'number' && typeof eLon === 'number') {
        const d = haversine(lat, lng, eLat, eLon)
        if (el?.tags?.shop && d < bestShopD) { bestShop = { name }; bestShopD = d }
        if ((el?.tags?.amenity === 'college' || el?.tags?.amenity === 'university') && d < bestCollegeD) { bestCollege = { name }; bestCollegeD = d }
        const isTemple = el?.tags?.amenity === 'place_of_worship' && ((el?.tags?.religion || '').toLowerCase() === 'hindu' || name.toLowerCase().includes('temple'))
        if (isTemple && d < bestTempleD) { bestTemple = { name }; bestTempleD = d }
      }
    }
    const parts: string[] = []
    if (bestShop) parts.push(`${bestShop.name} (${Math.max(1, Math.round(bestShopD))}m)`)
    if (bestCollege) parts.push(`${bestCollege.name} (${Math.max(1, Math.round(bestCollegeD))}m)`)
    if (bestTemple) parts.push(`${bestTemple.name} (${Math.max(1, Math.round(bestTempleD))}m)`)
    return parts.join(', ')
  }

  const computeSmoothed = () => {
    const samples = samplesRef.current.slice(-5);
    if (samples.length === 0) return null as null | { lat: number; lng: number };
    let wsum = 0, lat = 0, lng = 0;
    for (const s of samples) {
      const w = 1 / Math.max(s.accuracy, 1);
      lat += s.lat * w;
      lng += s.lng * w;
      wsum += w;
    }
    return { lat: lat / wsum, lng: lng / wsum };
  };

  const applyPosition = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const timestamp = position.timestamp || Date.now();
    if (samplesRef.current.length > 0) {
      const prev = samplesRef.current[samplesRef.current.length - 1];
      const jump = haversine(prev.lat, prev.lng, latitude, longitude);
      if (jump > 300 && (accuracy || 9999) > 50) {
        setCurrAccuracy(accuracy || null);
        setLastUpdate(timestamp);
        return;
      }
    }
    samplesRef.current.push({ lat: latitude, lng: longitude, accuracy, timestamp });
    if (samplesRef.current.length > 20) samplesRef.current.shift();
    const smoothed = computeSmoothed();
    const next = smoothed || { lat: latitude, lng: longitude };
    setForm(prev => ({ ...prev, location: { ...(prev.location || {}), lat: next.lat, lng: next.lng } }));
    setCurrAccuracy(accuracy || null);
    setLastUpdate(timestamp);
    scheduleReverseGeocode(next.lat, next.lng);
    const isOutdated = Date.now() - timestamp > 60_000; // 1 minute considered outdated
    if (isOutdated) setLocStatus('outdated');
    else if (accuracy && accuracy <= 10) setLocStatus('accurate');
    else setLocStatus('inaccurate');
    setVisualLoc({ lat: next.lat, lng: next.lng });

    if ((accuracy || 9999) <= 25) {
      const lg = { lat: next.lat, lng: next.lng, timestamp };
      lastGoodRef.current = lg;
      try { localStorage.setItem('lastGoodLoc', JSON.stringify(lg)); } catch {}
    }
  };

  const handleUseLocation = () => {
    setLocating(true);
    setLocStatus('searching');

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };

    let bestPosition: GeolocationPosition | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        applyPosition(position);
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }
        // Stop when we reach <= 10m accuracy
        if (position.coords.accuracy <= 10) {
          navigator.geolocation.clearWatch(watchId);
          setLocating(false);
          setLocStatus('accurate');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        navigator.geolocation.clearWatch(watchId);
        setLocating(false);
        if (error.code === 1) {
          setLocStatus('denied');
          alert('Location permission denied. Please allow access to capture coordinates.');
        } else if (error.code === 2) {
          setLocStatus('unavailable');
          alert('GPS signal unavailable. Trying network-based location.');
          // Try a network-based fallback
          navigator.geolocation.getCurrentPosition(
            (pos) => { applyPosition(pos); },
            (err) => { console.error('Network fallback failed:', err); setLocStatus('unavailable'); },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
          );
        } else if (error.code === 3) {
          setLocStatus('timeout');
          alert('GPS timeout. Trying network-based location.');
          navigator.geolocation.getCurrentPosition(
            (pos) => { applyPosition(pos); },
            (err) => { console.error('Network fallback failed:', err); setLocStatus('unavailable'); },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
          );
        } else {
          setLocStatus('unavailable');
          alert('Error getting location. Please ensure location services are enabled and permissions are granted.');
        }
      },
      options
    );

    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (bestPosition) {
        applyPosition(bestPosition);
        setLocating(false);
        setLocStatus((bestPosition.coords.accuracy || 9999) <= 10 ? 'accurate' : 'inaccurate');
      } else {
        if (lastGoodRef.current) {
          const { lat, lng, timestamp: ts } = lastGoodRef.current;
          setForm(prev => ({ ...prev, location: { ...(prev.location || {}), lat, lng } }));
          setLastUpdate(ts);
          setCurrAccuracy(null);
          setLocating(false);
          setLocStatus('inaccurate');
          scheduleReverseGeocode(lat, lng);
        } else {
          setLocStatus('timeout');
          navigator.geolocation.getCurrentPosition(
            (pos) => { applyPosition(pos); setLocating(false); },
            (err) => { console.error('Network fallback failed:', err); setLocating(false); setLocStatus('unavailable'); },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
          );
        }
      }
    }, 20000);
  };
  

  function validate() {
    const next: { [k: string]: string } = {}
    if (!form.title || form.title.trim().length < 3) next.title = 'Title must be at least 3 characters'
    if (!form.type) next.type = 'Type is required'
    if (!form.description || form.description.trim().length < 10) next.description = 'Description must be at least 10 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    setSubmitError('')
    setOk('')
    if (!validate()) return
    setSaving(true)
    setSubmitStage('submit')
    try {
      const { photoUrl, ...meta } = form as any
      await onSubmit({ ...(meta as any), photoUrl } as any)
      setSubmitStage(photoUrl ? 'upload' : 'finalize')
      setOk('Complaint submitted successfully')
      localStorage.removeItem('complaintDraft')
      // Fully clear the form after successful submission
      setForm({ title: '', type: '', description: '', contact: '', photoUrl: '', location: { address: '' } } as any)
      setFileName('')
      setErrors({})
      setSubmitStage('finalize')
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setSaving(false)
      setSubmitStage('idle')
    }
  }

  return (
    <form className="panel form" onSubmit={e => { e.preventDefault(); submit() }}>
      {submitError && <div className="form-error">{submitError}</div>}
      <div className="grid two">
        <label>
          {t('form_title')}
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          {errors.title && <small className="muted" style={{ color: '#fecaca' }}>{errors.title}</small>}
        </label>
        <label>
          {t('form_type')}
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="">{t('form_select')}</option>
            <option value="Robbery">{t('crime_robbery')}</option>
            <option value="Fraud">{t('crime_fraud')}</option>
            <option value="Harassment">{t('crime_harassment')}</option>
            <option value="Accident">{t('crime_accident')}</option>
            <option value="Theft">{t('crime_theft')}</option>
            <option value="murder">{t('crime_murder')}</option>
          </select>
          {errors.type && <small className="muted" style={{ color: '#fecaca' }}>{errors.type}</small>}
        </label>
      </div>
      <label>
        {t('form_description')}
        <div className="textarea-wrap">
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
          <button type="button" className={`mic-overlay ${recognizing ? 'active' : ''}`} onClick={toggleVoice} aria-label={recognizing ? 'Stop recording' : 'Start recording'}>
            <FiMic />
          </button>
        </div>
        {errors.description && <small className="muted" style={{ color: '#fecaca' }}>{errors.description}</small>}
      </label>
      <div className="grid two">
        <label>{t('form_date')}<input type="date" value={(form as any).date || ''} onChange={e => setForm({ ...form, ...(form as any), date: e.target.value } as any)} /></label>
        <label>{t('form_time')}<input type="time" value={(form as any).time || ''} onChange={e => setForm({ ...form, ...(form as any), time: e.target.value } as any)} /></label>
      </div>
      <div className="grid two">
        <label>{t('form_contact')}<input value={form.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} /></label>
      </div>
      <label>
        {t('form_location_address')}
        <input
          value={form.location?.address || ''}
          onChange={e => {
            setAddressManual(true)
            setForm({ ...form, location: { ...(form.location || {}), address: e.target.value } })
          }}
        />
      </label>
      <div className="grid two">
        <label>
          {t('form_latitude')}
          <input value={typeof form.location?.lat === 'number' ? Number(form.location?.lat).toFixed(6) : 'null'} readOnly />
        </label>
        <label>
          {t('form_longitude')}
          <input value={typeof form.location?.lng === 'number' ? Number(form.location?.lng).toFixed(6) : 'null'} readOnly />
        </label>
      </div>
      {/* Location status and preview */}
      <div className="grid two" style={{ alignItems: 'start', marginTop: 8 }}>
        <div>
          <div className="muted" style={{ marginBottom: 6 }}>
            {t('loc_status')}: {locStatus}
            {currAccuracy != null && <span> · {t('loc_accuracy')} {Math.round(currAccuracy)}m</span>}
            {lastUpdate != null && <span> · {t('loc_updated')} {new Date(lastUpdate).toLocaleTimeString()}</span>}
          </div>
          
        </div>
        {visualLoc && (
          <div>
            <iframe
              title="your-location"
              src={`https://maps.google.com/maps?q=${visualLoc.lat},${visualLoc.lng}&z=16&output=embed`}
              style={{ width: '100%', height: 180, border: 0, borderRadius: 10 }}
            />
          </div>
        )}
      </div>
      <div className="actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn sm" onClick={handleUseLocation} disabled={locating}>
          {locating ? useI18n().t('locating') : t('use_my_location')}
        </button>
      </div>
      <div className="file-row">
        <label className="file">
          <span className="file-label">{t('upload_photo')}</span>
          <button type="button" className="file-cta" onClick={() => fileInputRef.current?.click()}>Choose image</button>
          <input type="file" accept="image/*" onChange={handleFile} ref={fileInputRef} style={{ display: 'none' }} />
        </label>
        {form.photoUrl && (
          <>
            <div className="file-chip">
              <span>Image selected</span>
              <button
                type="button"
                className="chip-clear"
                aria-label={t('remove_photo')}
                onClick={() => {
                  setForm(prev => ({ ...prev, photoUrl: '' }))
                  setFileName('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <FiX />
              </button>
            </div>
            <div className="preview-thumb-wrap">
              <img src={form.photoUrl} alt="image preview" className="preview-thumb" />
              <button
                type="button"
                className="preview-clear"
                aria-label={t('remove_photo')}
                onClick={() => {
                  setForm(prev => ({ ...prev, photoUrl: '' }))
                  setFileName('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                <FiX />
              </button>
            </div>
          </>
        )}
        {submitError && (
          <span className="form-error" role="alert" style={{ marginLeft: 8 }}>{submitError}</span>
        )}
      </div>
      <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn primary" type="submit" disabled={saving}>{saving ? t('submitting') : t('submit_btn')}</button>
        {saving && submitStage !== 'idle' && (
          <span className="muted">{submitStage === 'submit' ? t('sending') : submitStage === 'upload' ? t('uploading_photo') : t('finalizing')}</span>
        )}
        {ok && <span className="muted" style={{ marginLeft: 12 }}>{ok}</span>}
      </div>
    </form>
  )
}

function MapView({ items }: { items: Complaint[] }) {
  // Prefer coordinates for accurate visualization, but keep address fallback to maintain existing functionality
  const withLoc = items.filter(i => (
    typeof i.location?.lat === 'number' && typeof i.location?.lng === 'number'
  ) || i.location?.address)
  const [selectedId, setSelectedId] = useState<string>(withLoc[0]?._id || '')
  if (withLoc.length === 0) return <div className="panel"><div className="muted">No complaints with coordinates or address. Use "Use my location" to capture precise coordinates.</div></div>
  const sel = withLoc.find(c => c._id === selectedId) || withLoc[0]
  const hasCoords = typeof sel.location?.lat === 'number' && typeof sel.location?.lng === 'number'
  const url = hasCoords
    ? `https://maps.google.com/maps?q=${sel.location!.lat},${sel.location!.lng}&z=12&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(sel.location!.address || '')}&z=12&output=embed`
  return (
    <div className="panel notif-panel">
      <div className="muted">Pins shown for first location; switch to Google Maps API later with your key for interactive maps.</div>
      <iframe title="map" src={url} style={{ width: '100%', minHeight: 360, border: 0, borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
        {withLoc.map(c => {
          const cardHasCoords = typeof c.location?.lat === 'number' && typeof c.location?.lng === 'number'
          const cardUrl = cardHasCoords
            ? `https://maps.google.com/maps?q=${c.location!.lat},${c.location!.lng}&z=13&output=embed`
            : `https://maps.google.com/maps?q=${encodeURIComponent(c.location!.address || '')}&z=13&output=embed`
          const openUrl = cardHasCoords
            ? `https://maps.google.com/?q=${c.location!.lat},${c.location!.lng}`
            : `https://maps.google.com/?q=${encodeURIComponent(c.location!.address || '')}`
          return (
            <div key={c._id} className="card" style={{ padding: 16 }}>
              <div className="card-header">
                <h3 className="card-title" title={c.title} style={{ fontSize: '1.05rem' }}>{c.title}</h3>
                <StatusBadge status={(c.status as ComplaintStatus) || 'Pending'} />
              </div>
              <div className="card-subtitle" style={{ marginBottom: 10 }}>
                {cardHasCoords ? `${Number(c.location!.lat).toFixed(6)}, ${Number(c.location!.lng).toFixed(6)}` : (c.location?.address || 'No address')}
              </div>
              <iframe title={`map-${c._id}`} src={cardUrl} loading="lazy" style={{ width: '100%', height: 160, border: 0, borderRadius: 10 }} />
              <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn ghost" onClick={() => { setSelectedId(c._id!); const top = document.querySelector('.panel iframe'); if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Focus on map</button>
        <a className="btn primary" href={openUrl} target="_blank" rel="noopener noreferrer">{useI18n().t('open_in_maps')}</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



function NotificationsPanel({ token }: { token: string }) {
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [q, setQ] = useState<string>('')
  const sound = useNotificationSound({ volume: 0.85, cooldownMs: 0 })

  useEffect(() => {
    let active = true
    const socket = connectRealtime('user', token)
    try { sound.setEnabled(true); sound.prime() } catch {}
    socket.on('user:notification', (payload: { message: string; complaintId?: string; type?: string; createdAt?: string }) => {
      setNotifications((prev) => [
        { _id: String(Date.now()), message: payload.message, type: payload.type || 'info', read: false, createdAt: payload.createdAt || new Date().toISOString(), complaintId: payload.complaintId || undefined },
        ...prev,
      ])
      sound.play()
    })
    ;(async () => {
      try {
        const res = await notificationsApi.list(token)
        if (active) setNotifications(res.notifications)
        try { socket.connect() } catch {}
      } catch (err: any) {
        if (active) setError(err.message || 'Failed to load notifications')
      } finally {
        if (active) setLoading(false)
      }
    })()
    const id = setInterval(() => {
      notificationsApi.list(token).then((res) => setNotifications(res.notifications)).catch(() => {})
    }, 10000)
    return () => { active = false; clearInterval(id); socket.disconnect() }
  }, [token, sound])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    try {
      const r = await notificationsApi.markRead(token, id)
      setNotifications(prev => prev.map(n => n._id === id ? r.notification : n))
    } catch (err: any) {
      setError(err.message || 'Failed to mark as read')
    }
  }

  async function markAllRead() {
    try {
      const r = await notificationsApi.markAllRead(token)
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
      <div className="notif-header desktop-only" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><FiBell /> {t('notifications_updates')}</h3>
          <span className="badge" title="Unread count">{unreadCount} {t('unread')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn ghost" onClick={() => { setLoading(true); notificationsApi.list(token).then(r => { setNotifications(r.notifications); setLoading(false) }).catch(() => setLoading(false)) }}><FiRefreshCw /> {t('refresh')}</button>
          <button className="btn" onClick={markAllRead}><FiCheck /> {t('mark_all_read')}</button>
        </div>
      </div>

      <div className="notif-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div className="search modern" aria-label="Search notifications" style={{ flex: 1 }}>
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('notifications_search_placeholder')} />
          {q && <button className="clear-btn" onClick={() => setQ('')} title={t('clear')}><FiX /></button>}
        </div>
        <div className="filters" style={{ display: 'flex', gap: 8 }}>
          <span className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('filter_all')}</span>
          <span className={`pill ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>{t('filter_unread')}</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <div className="muted">{t('notifications_loading')}</div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => (
            <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`}>
              <div className="left">
                <div className="title">{n.type ? n.type.toUpperCase() : 'UPDATE'}</div>
                <div>{n.message}</div>
                <div className="meta">{new Date(n.createdAt || '').toLocaleString()}</div>
              </div>
              <div className="right">
                {!n.read && <button className="btn sm" onClick={() => markRead(n._id)}><FiCheck /> {t('mark_read')}</button>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="muted">{t('no_notifications')}</div>}
        </div>
      )}
    </div>
  )
}

function SupportPanel({ token, profile, defaultTab = 'faq' }: { token: string; profile: ProfileUser | null; defaultTab?: 'faq' | 'chat' | 'feedback' }) {
  const [tab, setTab] = useState<'faq' | 'chat' | 'feedback'>(defaultTab)
  return (
    <div className="panel support-panel">
      <div className="support-header">
        <h2>{useI18n().t('support_heading')}</h2>
        <p className="muted">{useI18n().t('support_intro')}</p>
      </div>
      <div className="tabs compact">
        <button className={`tab ${tab === 'faq' ? 'active' : ''}`} onClick={() => setTab('faq')}><FiHelpCircle /> <span>{useI18n().t('faqs')}</span></button>
        <button className={`tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}><FiMessageCircle /> <span>{useI18n().t('tab_chat')}</span></button>
        <button className={`tab ${tab === 'feedback' ? 'active' : ''}`} onClick={() => setTab('feedback')}><FiStar /> <span>{useI18n().t('tab_feedback')}</span></button>
      </div>
      <div className="tab-body">
        {tab === 'faq' && <FaqSection token={token} />}
        {tab === 'chat' && <LiveChatWidget token={token} />}
        {tab === 'feedback' && <FeedbackSection profile={profile} />}
      </div>
    </div>
  )
}

function FaqSection({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [faqs, setFaqs] = useState<Array<{ _id: string; question: string; answer: string; category: string; helpfulCount: number; notHelpfulCount: number }>>([])
  const [openIds, setOpenIds] = useState<string[]>([])
  const [votingId, setVotingId] = useState<string | null>(null)
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({})
  const [sort, setSort] = useState<'relevance' | 'helpful' | 'category'>('relevance')
  const categories = ['All', 'Account Issues', 'Complaint Process', 'Technical Help']
  const suggestions = ['Account', 'Complaint', 'Technical', 'Ticket', 'Profile']

  useEffect(() => {
    let active = true
    supportApi.faqsList(q, category).then((res) => { if (active) setFaqs(res.faqs) }).catch(() => {})
    supportApi.faqVotes(token).then((res) => {
      if (!active) return
      const vm: Record<string, boolean> = {}
      res.votes.forEach(v => { vm[v.faqId] = true })
      setVotedMap(vm)
    }).catch(() => {})
    return () => { active = false }
  }, [q, category, token])

  function toggle(id: string) { setOpenIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function expandAll() { setOpenIds(faqs.map(f => f._id)) }
  function collapseAll() { setOpenIds([]) }

  const items = useMemo(() => {
    let arr = [...faqs]
    if (sort === 'helpful') arr.sort((a, b) => (b.helpfulCount - a.helpfulCount))
    if (sort === 'category') arr.sort((a, b) => a.category.localeCompare(b.category))
    return arr
  }, [faqs, sort])

  function copyLink(id: string) {
    const url = `${window.location.origin}/#faq-${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
  }

  async function vote(id: string, helpful: boolean) {
    try {
      setVotingId(id)
      const res = await supportApi.faqVote(token, id, helpful)
      const updated = res?.faq
      setFaqs(prev => prev.map(f => {
        if (f._id !== id) return f
        if (updated) return { ...f, helpfulCount: updated.helpfulCount, notHelpfulCount: updated.notHelpfulCount }
        return { ...f, helpfulCount: f.helpfulCount + (helpful ? 1 : 0), notHelpfulCount: f.notHelpfulCount + (!helpful ? 1 : 0) }
      }))
      setVotedMap(prev => ({ ...prev, [id]: true }))
    } catch (e) {
      // If already voted, mark as such and do not change counts
      const msg = (e instanceof Error && typeof e.message === 'string') ? e.message.toLowerCase() : ''
      if (msg.includes('already voted')) {
        setVotedMap(prev => ({ ...prev, [id]: true }))
      } else {
        // graceful fallback: optimistic increment and lock out further votes
        setFaqs(prev => prev.map(f => f._id === id ? { ...f, helpfulCount: f.helpfulCount + (helpful ? 1 : 0), notHelpfulCount: f.notHelpfulCount + (!helpful ? 1 : 0) } : f))
        setVotedMap(prev => ({ ...prev, [id]: true }))
      }
    } finally {
      setTimeout(() => setVotingId(null), 400)
    }
  }

  return (
    <div>
      <div className="faq-search">
        <div className="search">
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions…" />
        </div>
        <div className="faq-toolbar">
          <div className="results-count">{items.length} results</div>
          <div className="sort">
            <FiFilter />
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="sort-select">
              <option value="relevance">Relevance</option>
              <option value="helpful">Most Helpful</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div className="expand">
            <button className="btn sm" onClick={expandAll}><FiChevronDown /> Expand all</button>
            <button className="btn sm ghost" onClick={collapseAll}><FiChevronUp /> Collapse all</button>
          </div>
        </div>
      </div>
      <div className="faq-filters">
        {categories.map(c => (
          <button key={c} className={`pill ${category === '' && c === 'All' ? 'active' : category === c ? 'active' : ''}`} onClick={() => setCategory(c === 'All' ? '' : c)}>{c}</button>
        ))}
        <button className="pill ghost" onClick={() => { setQ(''); setCategory(''); }}>Clear</button>
        <div className="suggestions">
          {suggestions.map(s => (
            <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>
          ))}
        </div>
      </div>
      <div className="accordion">
        {items.map(f => (
          <div className={`accordion-item ${openIds.includes(f._id) ? 'open' : ''}`} key={f._id} id={`faq-${f._id}`}>
            <button className="accordion-header" onClick={() => toggle(f._id)}>
              <span className="question">{f.question}</span>
              <div className="accordion-meta">
                <span className="badge">{f.category}</span>
                <span className="helpful">{f.helpfulCount} found helpful</span>
                <FiChevronDown />
              </div>
            </button>
            <AnimatePresence initial={false}>
              {openIds.includes(f._id) && (
                <motion.div className="accordion-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{f.answer}</p>
                  <div className="faq-actions">
                    <div className="vote-group" aria-label="Was this helpful?">
                      <button className="vote" disabled={votingId === f._id || !!votedMap[f._id]} onClick={() => vote(f._id, true)}><FiThumbsUp /> Helpful <span className="count">{f.helpfulCount}</span></button>
                      <button className="vote ghost" disabled={votingId === f._id || !!votedMap[f._id]} onClick={() => vote(f._id, false)}><FiThumbsDown /> Not helpful <span className="count">{f.notHelpfulCount}</span></button>
                    </div>
                    {!!votedMap[f._id] && <div className="muted" style={{ fontSize: 12 }}>You have already voted for this question.</div>}
                    <button className="btn sm ghost" onClick={() => copyLink(f._id)}><FiLink /> Copy link</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {items.length === 0 && <div className="muted">No FAQs found. Try different keywords.</div>}
      </div>
    </div>
  )
}


function LiveChatWidget({ token }: { token: string }) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<Array<{ _id?: string; role: 'user' | 'assistant' | 'agent'; content: string; createdAt?: string }>>([])
  const [text, setText] = useState('')
  useEffect(() => { supportApi.chatList(token).then((r) => setMessages(r.messages)).catch(() => {}) }, [token])

  async function send() {
    const m = text.trim(); if (!m) return
    setText('')
    try {
      const r = await supportApi.chatSend(token, m, true)
      setMessages(prev => [...prev, ...r.messages])
    } catch {}
  }

  return (
    <div>
      <div className="chat-widget">
        <div className="chat-header">
          <span>Live Support</span>
          <button className="btn sm ghost" onClick={() => setOpen(v => !v)}>{open ? <FiX /> : useI18n().t('chat_toggle_open')}</button>
        </div>
        {open && (
          <div className="chat-body">
            <div className="chat-thread">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`bubble ${m.role}`}>{m.content}</div>
              ))}
            </div>
            <div className="chat-input">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={useI18n().t('type_message_placeholder')} />
              <button className="btn" onClick={send}><FiSend /> {useI18n().t('send_btn')}</button>
            </div>
          </div>
        )}
      </div>
      <button className="chat-floating-button" title="Support Chat" onClick={() => setOpen(true)}><FiMessageCircle /></button>
    </div>
  )
}
function FeedbackSection({ profile }: { profile: ProfileUser | null }) {
  const [rating, setRating] = useState<number>(0)
  const [text, setText] = useState<string>('')
  const [anonymous, setAnonymous] = useState<boolean>(false)
  const [stats, setStats] = useState<{ average: number; count: number }>({ average: 0, count: 0 })
  const [list, setList] = useState<Array<{ id: string; username: string; text: string; rating: number; createdAt: string }>>([])
  const [showOverall, setShowOverall] = useState<boolean>(false)
  useEffect(() => { supportApi.feedbackStats().then(setStats).catch(() => {}) }, [])
  useEffect(() => { supportApi.feedbackList().then((r) => setList(r.feedbacks)).catch(() => {}) }, [])
  async function submit() {
    if (!rating) { alert('Please select a rating'); return }
    await supportApi.feedbackSubmit({ rating, text, anonymous, userId: anonymous ? null : profile?.id || null })
    const s = await supportApi.feedbackStats(); setStats(s)
    const r = await supportApi.feedbackList().catch(() => null); if (r) setList(r.feedbacks)
  }
  const labels = ['Very Poor','Poor','Okay','Good','Excellent']
  const label = rating ? labels[rating-1] : 'Select a rating'
  const labelColor = rating <= 2 ? 'var(--sp-danger)' : rating === 3 ? '#f59e0b' : 'var(--sp-success)'
  return (
    <div className="feedback-card">
      <div className="feedback-header">
        <h3>{useI18n().t('feedback_heading')}</h3>
        <div className="muted">Help us improve your experience</div>
      </div>
      <div className="rating-row">
        <div className="rating-stars">
          {[1,2,3,4,5].map(n => (
            <button key={n} className={`star ${rating >= n ? 'filled' : ''}`} onClick={() => setRating(n)} aria-label={`${n} star`}>★</button>
          ))}
        </div>
        <div className="rating-label" style={{ color: labelColor }}>{label}</div>
      </div>
      <div className="desc-field">
        <div className="desc-header">
          <span className="label">{useI18n().t('feedback_optional_label')}</span>
          <span className="char-count">{text.length} / 500</span>
        </div>
        <textarea
          className="feedback-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={500}
          placeholder="Share details respectfully. Be specific and constructive."
        />
        <div className="hint muted">Avoid sensitive personal data. Focus on the experience.</div>
      </div>
      <div className="toggle-row">
        <label className="switch">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          <span className="knob"></span>
          <span className="label">Submit anonymously</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={showOverall} onChange={(e) => setShowOverall(e.target.checked)} />
          <span className="knob"></span>
          <span className="label">Show overall average</span>
        </label>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={submit} disabled={!rating}>{useI18n().t('send_feedback')}</button>
        <button className="btn ghost" onClick={() => { setRating(0); setText(''); setAnonymous(false) }}>Reset</button>
      </div>
      {showOverall && (
        <div className="feedback-stats" aria-live="polite">
          <div className="meter"><div className="bar" style={{ width: `${Math.round((stats.average/5)*100)}%` }}></div></div>
          <div className="avg-stars" aria-label={`Average ${stats.average.toFixed(1)} out of 5`}>
            {[1,2,3,4,5].map(n => (
              <span key={n} className={`a-star ${stats.average >= n ? 'filled' : ''}`}>★</span>
            ))}
          </div>
          <div className="muted">Avg {stats.average.toFixed(1)} · {stats.count} submissions</div>
        </div>
      )}
      <div className="feedback-list">
        <div className="list-header">
          <h4>{useI18n().t('recent_feedback')}</h4>
          <div className="muted">{list.length} entries</div>
        </div>
        <ul className="list" aria-live="polite">
          {list.map((item) => (
            <li key={item.id} className="feedback-item">
              <div className="item-head">
                <div className="avatar" aria-hidden>{(item.username || 'U')[0].toUpperCase()}</div>
                <div className="user">
                  <div className="name">{item.username}</div>
                  <div className="date muted">{new Date(item.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="rating-badge" title={`Rated ${item.rating} out of 5`}>
                  <FiStar /> <span>{item.rating}/5</span>
                </div>
              </div>
              {item.text && <div className="text">{item.text}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
