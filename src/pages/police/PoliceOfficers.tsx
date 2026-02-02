import { useEffect, useState } from 'react'
import { policeApi } from '../../services/police'

type Props = { token: string }

export default function PoliceOfficers({ token }: Props) {
  const [officers, setOfficers] = useState<Array<{ _id?: string; username: string; status?: 'Online'|'On Duty'|'Offline'; activeCases?: number; resolved?: number }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    policeApi.listOfficers(token).then((res) => setOfficers(res.officers)).catch((err) => setError(err.message || 'Failed to load officers'))
  }, [token])

  return (
    <div className="panel">
      <div className="label">Officer Management</div>
      {error && <div className="form-error">{error}</div>}
      <div className="table">
        <div className="thead">
          <div>Name</div>
          <div>Status</div>
          <div>Active Cases</div>
          <div>Resolved</div>
        </div>
        {officers.map((o) => (
          <div className="trow" key={o._id}>
            <div>{o.username}</div>
            <div><span className={`badge ${String(o.status).replace(/\s/g,'').toLowerCase()}`}>{o.status || 'Offline'}</span></div>
            <div>{o.activeCases || 0}</div>
            <div>{o.resolved || 0}</div>
          </div>
        ))}
        {officers.length === 0 && <div className="muted" style={{ padding: 10 }}>No officers found.</div>}
      </div>
    </div>
  )
}