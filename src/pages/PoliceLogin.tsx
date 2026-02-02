import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import AuthShowcase from '../components/AuthShowcase'
import loginimg from '../assets/loginimg.png'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { NAVI_MUMBAI_POLICE_STATIONS } from '../data/policeStations'

export default function PoliceLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [station, setStation] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password || !station) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await api.policeLogin(email, password, station)
      localStorage.setItem('policeToken', res.token)
      localStorage.setItem('policeUser', JSON.stringify(res.officer))
      navigate('/police/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <AuthShowcase
          title="Police Portal"
          subtitle="Sign in to view and manage complaints."
          imageSrc={loginimg}
          imageAlt="Police login illustration"
        />
      </div>
      <div className="auth-right">
        <motion.form className="auth-card auth-form" onSubmit={onSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Police Login</h3>
          <div className="auth-subtext">New officer? <Link to="/police/register">Create an account</Link></div>
          <div className="form-row">
            <input id="police-login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " />
            <label htmlFor="police-login-email">Email</label>
          </div>
          <div className="form-row">
            <div className="password-row">
              <input id="police-login-password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " />
              <label htmlFor="police-login-password">Password</label>
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="form-row">
            <select id="police-login-station" value={station} onChange={(e) => setStation(e.target.value)}>
              <option value="">Select Police Station</option>
              {NAVI_MUMBAI_POLICE_STATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label htmlFor="police-login-station">Police Station</label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
            <Link className="btn ghost" to="/police/register">Create Police Account</Link>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
