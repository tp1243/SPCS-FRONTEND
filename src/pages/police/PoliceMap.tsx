import { useEffect, useState } from 'react'
import { policeApi } from '../../services/police'

type Props = { token: string }

export default function PoliceMap({ token }: Props) {
  const [points, setPoints] = useState<Array<{ lat?: number; lng?: number; address?: string }>>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    policeApi.listComplaints(token, { fields: 'summary', limit: 200 }).then((res) => {
      const pts = res.complaints.map((c: any) => c.location || {}).filter((loc: any) => typeof loc.lat === 'number' && typeof loc.lng === 'number')
      setPoints(pts)
    }).catch((err) => setError(err.message || 'Failed to load map data'))
  }, [token])

  const first = points[0]
  const src = first ? `https://maps.google.com/maps?q=${first.lat},${first.lng}&t=&z=12&ie=UTF8&iwloc=&output=embed` : 'https://maps.google.com/maps?q=Navi%20Mumbai&t=&z=11&ie=UTF8&iwloc=&output=embed'

  return (
    <div className="panel">
      <div className="label">Live Map of Reported Incidents</div>
      {error && <div className="form-error">{error}</div>}
      <iframe title="map" src={src} style={{ width: '100%', minHeight: 420, border: 0, borderRadius: 10 }} />
      <div className="muted" style={{ marginTop: 8 }}>Clusters and heatmap to be added later. Click pins for details in future iteration.</div>
    </div>
  )
}