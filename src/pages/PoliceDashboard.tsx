import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PoliceNavbar from '../components/police/PoliceNavbar'
import PoliceSidebar from '../components/police/PoliceSidebar'
import { Suspense, lazy } from 'react'
const PoliceOverview = lazy(() => import('./police/PoliceOverview'))
const PoliceComplaints = lazy(() => import('./police/PoliceComplaints'))
const PoliceMap = lazy(() => import('./police/PoliceMap'))
const PoliceReports = lazy(() => import('./police/PoliceReports'))
const PoliceChat = lazy(() => import('./police/PoliceChat'))
const PoliceAlerts = lazy(() => import('./police/PoliceAlerts'))
const PoliceOfficers = lazy(() => import('./police/PoliceOfficers'))
const PoliceSettings = lazy(() => import('./police/PoliceSettings'))
const PoliceNotifications = lazy(() => import('./police/PoliceNotifications'))

export default function PoliceDashboard() {
  const navigate = useNavigate()
  const [section, setSection] = useState<string>('overview')
  const [officer, setOfficer] = useState<{ id?: string; username: string; station?: string; email?: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('policeToken')
    const userStr = localStorage.getItem('policeUser')
    if (!token || !userStr) { navigate('/police/login'); return }
    try {
      const u = JSON.parse(userStr)
      setOfficer({ id: u.id, username: u.username, station: u.station, email: u.email })
    } catch { navigate('/police/login') }
  }, [])

  function logout() {
    localStorage.removeItem('policeToken')
    localStorage.removeItem('policeUser')
    navigate('/police/login')
  }

  const username = officer?.username || 'Officer'
  const token = localStorage.getItem('policeToken') || ''

  const content = useMemo(() => {
    switch (section) {
      case 'overview':
        return <Suspense fallback={<div />}> <PoliceOverview token={token} station={officer?.station} /> </Suspense>
      case 'active':
      case 'pending':
      case 'completed':
        return <Suspense fallback={<div />}> <PoliceComplaints token={token} filter={section} officer={officer || undefined} /> </Suspense>
      case 'fir':
        return <Suspense fallback={<div />}> <PoliceComplaints token={token} categoryFilter="fir" officer={officer || undefined} /> </Suspense>
      case 'non-fir':
        return <Suspense fallback={<div />}> <PoliceComplaints token={token} categoryFilter="non-fir" officer={officer || undefined} /> </Suspense>
      case 'map':
        return <Suspense fallback={<div />}> <PoliceMap token={token} /> </Suspense>
      case 'analytics':
        return <Suspense fallback={<div />}> <PoliceReports token={token} /> </Suspense>
      case 'chat':
        return <Suspense fallback={<div />}> <PoliceChat token={token} officer={officer || undefined} /> </Suspense>
      case 'alerts':
        return <Suspense fallback={<div />}> <PoliceAlerts token={token} /> </Suspense>
      case 'notifications':
        return <Suspense fallback={<div />}> <PoliceNotifications token={token} /> </Suspense>
      case 'officers':
        return <Suspense fallback={<div />}> <PoliceOfficers token={token} /> </Suspense>
      case 'settings':
        return <Suspense fallback={<div />}> <PoliceSettings token={token} /> </Suspense>
      case 'help':
        return (
          <div className="panel">
            <div className="muted">For help, contact system admin or see documentation.</div>
          </div>
        )
      default:
        return <Suspense fallback={<div />}> <PoliceOverview token={token} /> </Suspense>
    }
  }, [section, token, officer])

  function handleSearch(_q: string) {
    setSection('active')
    // The PoliceComplaints component handles its own search internally.
    // Here we only switch to the Active Complaints view.
  }

  return (
    <div className="dashboard">
      <PoliceNavbar token={token} username={username} onSearch={handleSearch} onLogout={logout} />
      <div className="dash-body">
        <PoliceSidebar active={section} onChange={setSection} onLogout={logout} />
        <main className="dash-main">
          {content}
        </main>
      </div>
    </div>
  )
}