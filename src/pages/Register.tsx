import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import AuthShowcase from '../components/AuthShowcase'
import loginimg from '../assets/loginimg.png'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import SocialAuth from '../components/SocialAuth'
import AuthHeader from '../components/AuthHeader'
import OtpModal from '../components/OtpModal'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [beginPayload, setBeginPayload] = useState<{ username?: string; password?: string; phone?: string } | null>(null)
  

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const userStr = params.get('user')
    if (token) {
      localStorage.setItem('token', token)
      if (userStr) {
        try { localStorage.setItem('user', userStr) } catch {}
      }
      navigate('/user')
    }
  }, [location.search])


  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setPhoneError('Enter valid phone no'); return }
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password)
    if (!strong) { setPwdError('Enter strong password with uppercase, lowercase, number and symbol'); return }
    if (!username || !email || !password) { setError('Please fill in all fields'); return }
    const normalizedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`) : undefined
    setBeginPayload({ username, password, phone: normalizedPhone })
    setOtpOpen(true)
  }

  // OTP handling moved to dedicated VerifyOtp page

  return (
    <>
      <AuthHeader variant="register" />
      <div className="auth-layout user-auth">
      <div className="auth-left">
        <AuthShowcase title="Create your account" subtitle="Join SPCS to submit and track complaints." imageSrc={loginimg} imageAlt="Register illustration" />
      </div>
      <div className="auth-right">
        <motion.form className="auth-card auth-form" onSubmit={onSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Create an account</h3>
          <div className="auth-subtext">Already have an account? <Link to="/login">Log in</Link></div>
          <div className="form-row">
            <input id="register-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " />
            <label htmlFor="register-username">Username</label>
          </div>
          <div className="form-row">
            <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " />
            <label htmlFor="register-email">Email</label>
          </div>
          <div className="form-row phone-row">
            <div className="country-prefix">IND +91</div>
            <input id="register-phone" type="tel" value={phone} onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              setPhone(v)
              if (!v) setPhoneError('')
              else if (v.length > 10) setPhoneError('Enter valid phone no')
              else if (v.length < 10) setPhoneError('Enter 10-digit phone no')
              else setPhoneError('')
            }} placeholder="Mobile number" />
          </div>
          {phoneError && <div className="form-error">{phoneError}</div>}
          <div className="form-row">
            <div className="password-row">
              <input id="register-password" type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => {
                const v = e.target.value
                setPassword(v)
                const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(v)
                setPwdError(ok ? '' : 'Enter strong password with uppercase, lowercase, number and symbol')
              }} placeholder=" " />
              <label htmlFor="register-password">Password</label>
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Hide password' : 'Show password'}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          {pwdError && <div className="form-error">{pwdError}</div>}
          {error && <div className="form-error">{error}</div>}
          <div className="tc-row">
            <input id="tc" type="checkbox" defaultChecked />
            <label htmlFor="tc">I agree to the <a href="#terms">Terms & Conditions</a></label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn primary">Register</button>
            <Link className="btn ghost" to="/login">Already have an account</Link>
          </div>
          <SocialAuth />
        </motion.form>

        
      </div>
      </div>
      <OtpModal
        open={otpOpen}
        purpose="register"
        email={email}
        beginPayload={beginPayload || undefined}
        onClose={() => setOtpOpen(false)}
        onSuccess={(res: any) => {
          try {
            localStorage.setItem('token', res.token)
            localStorage.setItem('user', JSON.stringify(res.user))
          } catch {}
          setOtpOpen(false)
          navigate('/user')
        }}
      />
    </>
  )
}
