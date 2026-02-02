import { useEffect, useState } from 'react'
import { policeApi } from '../../services/police'

type Props = { token: string }

export default function PoliceAlerts({ token }: Props) {
  const [alerts, setAlerts] = useState<Array<{ _id?: string; title: string; priority?: 'high'|'medium'|'low'; createdAt?: string; handled?: boolean }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    policeApi.listAlerts(token).then((res) => setAlerts(res.alerts)).catch((err) => setError(err.message || 'Failed to load alerts'))
  }, [token])

  async function markHandled(id?: string) {
    if (!id) return
    try {
      await policeApi.handleAlert(token, id)
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, handled: true } : a))
    } catch (err: any) { setError(err.message || 'Failed to mark handled') }
  }

  return (
    <div className="panel">
      <div className="label">Emergency Alerts</div>
      {error && <div className="form-error">{error}</div>}
      <div className="list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((a) => (
          <div key={a._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${a.priority}`}>{a.priority?.toUpperCase()}</span>
                <strong>{a.title}</strong>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>Created: {new Date(a.createdAt || '').toLocaleString()}</div>
            </div>
            <div>
              {a.handled ? (
                <span className="badge success">Handled</span>
              ) : (
                <button className="btn sm" onClick={() => markHandled(a._id)}>Mark as Handled</button>
              )}
            </div>
          </div>
        ))}
        {alerts.length === 0 && <div className="muted">No active alerts.</div>}
      </div>
      <audio id="alertSound" src="/sounds/alert.mp3" preload="auto" />
      <div className="muted" style={{ marginTop: 8 }}>Alert sound and blinking UI can be enhanced later.</div>
    </div>
  )
}