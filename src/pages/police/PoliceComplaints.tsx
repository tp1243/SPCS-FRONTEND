import { useEffect, useMemo, useRef, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import type { ComplaintStatus } from '../../types'
import { policeApi } from '../../services/police'
import { useNotificationSound } from '../../components/useNotificationSound'

type Props = { token: string; filter?: 'active' | 'pending' | 'completed'; categoryFilter?: 'fir' | 'non-fir'; officer?: { id?: string; username: string; station?: string } }

type ComplaintRow = {
  _id?: string
  title: string
  type: string
  category?: string
  status?: ComplaintStatus
  createdAt?: string
  description?: string
  location?: { lat?: number; lng?: number; address?: string }
  assignedOfficerName?: string
  photoUrl?: string
}

export default function PoliceComplaints({ token, filter, categoryFilter, officer }: Props) {
  const [items, setItems] = useState<ComplaintRow[]>([])
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const notify = useNotificationSound({ volume: 0.85, cooldownMs: 0 })
  const firstPoll = useRef(true)
  const itemsRef = useRef<ComplaintRow[]>([])
  useEffect(() => { itemsRef.current = items }, [items])

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

  useEffect(() => {
    let active = true
    setLoading(true)
    const statusParam = filter === 'active' ? 'active' : filter === 'pending' ? 'pending' : filter === 'completed' ? 'completed' : ''
    try {
      const cacheKey = `policeComplaintsCache:${statusParam || 'all'}`
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null')
      if (cached && Array.isArray(cached)) { setItems(cached); setLoading(false) }
    } catch {}
    const fieldsParam = filter === 'pending' ? undefined : 'summary'
    policeApi.listComplaints(token, { status: statusParam || undefined, ...(fieldsParam ? { fields: fieldsParam } : {}), limit: 100 } as any).then((res) => {
      if (!active) return
      let rows = res.complaints
      if (categoryFilter) {
        const want = categoryFilter.toLowerCase()
        rows = rows.filter((c: any) => String(c.category || '').trim().toLowerCase() === want)
      }
      setItems(rows)
      setLoading(false)
      try {
        const cacheKey = `policeComplaintsCache:${statusParam || 'all'}`
        localStorage.setItem(cacheKey, JSON.stringify(rows))
      } catch {}
    }).catch(() => { setLoading(false) })
    return () => { active = false }
  }, [token, filter, categoryFilter])

  // Poll for new complaints and play a notification when new IDs appear
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const statusParam = filter === 'active' ? 'active' : filter === 'pending' ? 'pending' : filter === 'completed' ? 'completed' : ''
        const fieldsParam = filter === 'pending' ? undefined : 'summary'
        const res = await policeApi.listComplaints(token, { status: statusParam || undefined, ...(fieldsParam ? { fields: fieldsParam } : {}), limit: 100 } as any)
        let rows = res.complaints
        if (categoryFilter) {
          const want = categoryFilter.toLowerCase()
          rows = rows.filter((c: any) => String(c.category || '').trim().toLowerCase() === want)
        }
        const oldIds = new Set(itemsRef.current.map(c => c._id))
        const newIds = new Set(rows.map((c: any) => c._id))
        let hasNew = false
        for (const id of newIds) { if (!oldIds.has(id)) { hasNew = true; break } }
        setItems(rows)
        itemsRef.current = rows
        if (!firstPoll.current && hasNew) notify.play()
        if (firstPoll.current) firstPoll.current = false
      } catch (err) {
        // ignore transient poll errors
      }
    }, 30000)
    return () => clearInterval(id)
  }, [token, filter, categoryFilter, notify])

  const statuses: ComplaintStatus[] = ['Pending', 'Under Review', 'In Progress', 'Solved']
  const types = useMemo(() => {
    const defaultTypes = ['Robbery','Fraud','Harassment','Accident','Assault','Theft']
    const uniq = Array.from(new Set(items.map(i => i.type).filter(Boolean))) as string[]
    return Array.from(new Set([...defaultTypes, ...uniq])).sort((a, b) => a.localeCompare(b))
  }, [items])

  function priorityOf(c: ComplaintRow): 'high' | 'medium' | 'low' {
    const text = `${c.title || ''} ${c.type || ''} ${c.category || ''} ${c.description || ''}`.toLowerCase()
    const highWords = ['accident','violence','attack','assault','murder','rape','kidnap','weapon','injury','blood','fire','arson','extortion','threat','emergency','urgent','panic','help','danger']
    const mediumWords = ['harassment','fraud','fight','suspicious','disturbance','vandalism','theft','robbery','snatch','bully']
    const lowWords = ['noc','verification','certificate','passport','address proof','clearance','document','service','request','lost','missing']
    const has = (ws: string[]) => ws.some(w => text.includes(w))
    if (has(highWords)) return 'high'
    if ((c.category || '').toLowerCase() === 'fir') {
      if (has(mediumWords)) return 'high'
      return 'medium'
    }
    if (has(mediumWords)) return 'medium'
    if (has(lowWords)) return 'low'
    return 'low'
  }

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase()
    const f = items.filter(c =>
      (!categoryFilter || String(c.category || '').trim().toLowerCase() === categoryFilter) &&
      (!statusFilter || c.status === statusFilter) &&
      (!typeFilter || c.type === typeFilter) &&
      (
        norm === '' ||
        c.title.toLowerCase().includes(norm) ||
        (c._id || '').toLowerCase().includes(norm) ||
        (c.status || '').toLowerCase().includes(norm)
      )
    )
    const pr = { high: 3, medium: 2, low: 1 }
    return f.sort((a, b) => {
      if (filter === 'pending') {
        const pa = pr[priorityOf(a)]
        const pb = pr[priorityOf(b)]
        if (pa !== pb) return pb - pa
      }
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sortBy === 'newest' ? db - da : da - db
    })
  }, [items, q, statusFilter, typeFilter, sortBy])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, ComplaintRow[]>()
    for (const c of filtered) {
      const d = new Date(c.createdAt || 0)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const arr = map.get(key) || []
      arr.push(c)
      map.set(key, arr)
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    return entries.map(([key, rows]) => {
      const label = new Date(key).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
      const pr = { high: 3, medium: 2, low: 1 }
      const sortedRows = rows.slice().sort((a, b) => {
        const pa = pr[priorityOf(a)]
        const pb = pr[priorityOf(b)]
        if (pa !== pb) return pb - pa
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return sortBy === 'newest' ? db - da : da - db
      })
      return { key, label, rows: sortedRows }
    })
  }, [filtered, sortBy])

  async function assignToMe(id?: string) {
    if (!id || !officer) return
    try {
      const res = await policeApi.assignComplaint(token, id)
      setItems(prev => prev.map(it => it._id === id ? { ...it, assignedOfficerName: res.complaint.assignedOfficerName } : it))
    } catch (err: any) {
      setError(err.message || 'Assign failed')
    }
  }

  async function updateStatus(id?: string, status?: ComplaintStatus) {
    if (!id || !status) return
    try {
      const res = await policeApi.updateComplaintStatus(token, id, status)
      setItems(prev => prev.map(it => it._id === id ? { ...it, status: res.complaint.status } : it))
      try { window.dispatchEvent(new CustomEvent('spcs:complaint-status-updated', { detail: { id, status: res.complaint.status } })) } catch {}
      try {
        const mapBucket = (s: ComplaintStatus) => s === 'Solved' ? 'completed' : (s === 'In Progress' ? 'active' : 'pending')
        const buckets = ['all','active','pending','completed']
        for (const b of buckets) {
          const key = `policeComplaintsCache:${b}`
          const arr = JSON.parse(localStorage.getItem(key) || '[]')
          if (Array.isArray(arr) && arr.length) {
            const idx = arr.findIndex((c: any) => String(c._id) === String(id))
            if (idx >= 0) {
              const updated = { ...arr[idx], status: res.complaint.status }
              const newArr = arr.slice()
              newArr.splice(idx, 1)
              if (b === 'all' || mapBucket((res.complaint.status || 'Pending') as ComplaintStatus) === b) newArr.unshift(updated)
              localStorage.setItem(key, JSON.stringify(newArr))
            }
          }
        }
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Update failed')
    }
  }

  return (
    <div className="panel">
      <div className="table-toolbar">
        <div className="search" aria-label="Search complaints">
          <FiSearch />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, ID, status" />
        </div>
        <div className="filters">
          <span className={`pill ${statusFilter === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All Status</span>
          {statuses.map(s => (
            <span key={s} className={`pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</span>
          ))}
        </div>
        <div className="sort">
          <span className="muted">Type</span>
          <select className="sort-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="sort">
          <span className="muted">Sort</span>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      {loading ? <div className="muted">Loading complaints…</div> : (
        <>
          {filter === 'pending' ? (
            <div className="grouped-table">
              {groupedByDate.map(group => (
                <div className="date-group" key={group.key}>
                  <div className="date-heading">{group.label}</div>
                  <div className="table">
                    {group.rows.map((c) => (
                      <div className={`trow ${priorityOf(c) === 'high' ? 'urgent-row' : ''}`} key={c._id}>
                        <div>{c._id?.slice(-6)}</div>
                        <div className="title-cell" title={c.title}>
                          {c.photoUrl ? (
                            <img className="thumb" src={c.photoUrl} alt="complaint photo" />
                          ) : (
                            <span className="thumb placeholder" aria-hidden />
                          )}
                          <span className="title-text">{c.title}</span>
                        </div>
                        <div>{new Date(c.createdAt || '').toLocaleDateString()}</div>
                    <div>
                      {c.status ? <span className={`badge ${c.status.replace(/\s/g, '-').toLowerCase()}`}>{c.status}</span> : '-'}
                      {priorityOf(c) === 'high' && <span className="badge urgent" style={{ marginLeft: 8 }}>Urgent</span>}
                    </div>
                        <div>{c.assignedOfficerName || '-'}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <DetailsModalButton item={c} token={token} />
                          <button className="btn sm ghost" onClick={() => assignToMe(c._id)} disabled={!officer || c.assignedOfficerName === officer?.username}>Assign to me</button>
                          <select value={c.status || 'Pending'} onChange={(e) => updateStatus(c._id, e.target.value as ComplaintStatus)} className="sort-select" style={{ paddingRight: 24 }} disabled={(c.status || '') === 'Solved'}>
                            <option>Pending</option>
                            <option>Under Review</option>
                            <option>In Progress</option>
                            <option>Solved</option>
                          </select>
                        </div>
                      </div>
                    ))}
                    {group.rows.length === 0 && <div className="muted" style={{ padding: 10 }}>No complaints for this date.</div>}
                  </div>
                </div>
              ))}
              {groupedByDate.length === 0 && <div className="muted" style={{ padding: 10 }}>No complaints match filters.</div>}
            </div>
          ) : (
            <div className="table">
              <div className="thead">
                <div>ID</div>
                <div>Title</div>
                <div>Date</div>
                <div>Status</div>
                <div>Assigned</div>
                <div>Actions</div>
              </div>
              {filtered.map((c) => (
                <div className={`trow ${priorityOf(c) === 'high' ? 'urgent-row' : ''}`} key={c._id}>
                  <div>{c._id?.slice(-6)}</div>
                  <div className="title-cell" title={c.title}>
                    {c.photoUrl ? (
                      <img className="thumb" src={c.photoUrl} alt="complaint photo" />
                    ) : (
                      <span className="thumb placeholder" aria-hidden />
                    )}
                    <span className="title-text">{c.title}</span>
                  </div>
                  <div>{new Date(c.createdAt || '').toLocaleDateString()}</div>
                  <div>
                    {c.status ? <span className={`badge ${c.status.replace(/\s/g, '-').toLowerCase()}`}>{c.status}</span> : '-'}
                    {priorityOf(c) === 'high' && <span className="badge urgent" style={{ marginLeft: 8 }}>Urgent</span>}
                  </div>
                  <div>{c.assignedOfficerName || '-'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <DetailsModalButton item={c} token={token} />
                    <button className="btn sm ghost" onClick={() => assignToMe(c._id)} disabled={!officer || c.assignedOfficerName === officer?.username}>Assign to me</button>
                    <select value={c.status || 'Pending'} onChange={(e) => updateStatus(c._id, e.target.value as ComplaintStatus)} className="sort-select" style={{ paddingRight: 24 }} disabled={(c.status || '') === 'Solved'}>
                      <option>Pending</option>
                      <option>Under Review</option>
                      <option>In Progress</option>
                      <option>Solved</option>
                    </select>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="muted" style={{ padding: 10 }}>No complaints match filters.</div>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DetailsModalButton({ item, token }: { item: ComplaintRow; token: string }) {
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<any>(item)
  async function openModal() { setOpen(true); try { const res = await policeApi.getComplaintById(token, String(item._id || '')); setDetails(res.complaint) } catch {} }
  return (
    <>
      <button className="btn sm" onClick={openModal}>View Details</button>
      {open && (
        <div className="modal">
          <div className="modal-body">
            <button className="icon-btn close" aria-label="Close" onClick={() => setOpen(false)}><FiX /></button>
            <h3 style={{ marginBottom: 6 }}>{details.title}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 10 }}>
              <div><span className="muted">Type</span><div>{details.type || '-'}</div></div>
              <div><span className="muted">Category</span><div>{(details.category || '-').toUpperCase()}</div></div>
              <div><span className="muted">Status</span><div>{details.status ? <span className={`badge ${String(details.status).replace(/\s/g,'-').toLowerCase()}`}>{details.status}</span> : '-'}</div></div>
              <div><span className="muted">Filed On</span><div>{details.createdAt ? new Date(details.createdAt).toLocaleString() : '-'}</div></div>
              <div><span className="muted">Citizen :</span><div>{details.userId?.username || details.userId?.email || '-'}</div></div>
            </div>
            {details.photoUrl && <img src={details.photoUrl} alt="evidence" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />}
            {details.location?.address && (
              <div style={{ marginBottom: 10 }}>
                <span className="muted">Location</span>
                <div>{details.location.address}</div>
              </div>
            )}
            {details.description?.trim() && (
              <div className="modal-desc" style={{ marginBottom: 10 }}>
                <span className="muted">Description</span>
                <div style={{ whiteSpace: 'pre-wrap' }}>{details.description}</div>
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <span className="muted">Assigned Officer</span>
              <div>{details.assignedOfficerName || details.assignedOfficer || '-'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
