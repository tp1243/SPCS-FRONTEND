import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import AuthShowcase from '../components/AuthShowcase'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { NAVI_MUMBAI_POLICE_STATIONS } from '../data/policeStations'

export default function PoliceRegister() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [station, setStation] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !email || !password || !station) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await api.policeRegister(username, email, password, station)
      localStorage.setItem('policeToken', res.token)
      localStorage.setItem('policeUser', JSON.stringify(res.officer))
      navigate('/police/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <AuthShowcase
          title="Create Police Account"
          subtitle="Register with your station to access the portal."
          imageSrc="/ashoka-pillar.jpg"
          imageAlt="Ashoka Pillar - Satyameva Jayate"
        />
      </div>
      <div className="auth-right">
        <motion.form className="auth-card auth-form" onSubmit={onSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Police Registration</h3>
          <div className="form-row">
            <input id="police-register-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " />
            <label htmlFor="police-register-username">Username</label>
          </div>
          <div className="form-row">
            <input id="police-register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " />
            <label htmlFor="police-register-email">Email</label>
          </div>
          <div className="form-row">
            <div className="password-row">
              <input id="police-register-password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " />
              <label htmlFor="police-register-password">Password</label>
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="form-row">
            <select id="police-register-station" value={station} onChange={(e) => setStation(e.target.value)}>
              <option value="">Select Police Station</option>
              {NAVI_MUMBAI_POLICE_STATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label htmlFor="police-register-station">Police Station</label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
            <Link className="btn ghost" to="/police/login">Already have an account</Link>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
