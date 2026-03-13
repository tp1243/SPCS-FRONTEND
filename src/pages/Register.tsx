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
  const [aadhaarPhotoData, setAadhaarPhotoData] = useState<string | null>(null)
  const [aadhaarError, setAadhaarError] = useState<string>('')
  const [otpOpen, setOtpOpen] = useState(false)
  const [beginPayload, setBeginPayload] = useState<{ username?: string; password?: string; phone?: string; aadhaarPhotoData?: string } | null>(null)
  

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
    setBeginPayload({ username, password, phone: normalizedPhone, aadhaarPhotoData: aadhaarPhotoData || undefined })
    setOtpOpen(true)
  }

  // OTP handling moved to dedicated VerifyOtp page

  function handleAadhaarFile(file: File) {
    setAadhaarError('')
    const maxBytes = 5 * 1024 * 1024
    const okType = /image\/(png|jpeg|jpg|webp)$/i.test(file.type)
    const sizeOk = file.size <= maxBytes
    if (!okType) { setAadhaarError('Unsupported file type'); return }
    if (!sizeOk) { setAadhaarError('File too large (max 5MB)'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result || '')
      setAadhaarPhotoData(data)
    }
    reader.onerror = () => setAadhaarError('Failed to read file')
    reader.readAsDataURL(file)
  }

  return (
    <>
      <AuthHeader variant="register" />
      <div className="auth-layout user-auth">
      <div className="auth-left">
        <AuthShowcase title="Create your account" subtitle="Join SPCS to submit and track complaints." imageSrc={loginimg} imageAlt="Register illustration" />
      </div>
      <div className="auth-right">
        <motion.form className="auth-card auth-form register-card" onSubmit={onSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="form-header">
            <h3>Create your account</h3>
            <div className="form-sub">Secure & fast onboarding</div>
            <div className="auth-subtext">Already have an account? <Link to="/login">Log in</Link></div>
          </div>
          <div className="grid two">
            <div className="form-row">
              <input id="register-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " />
              <label htmlFor="register-username">Username</label>
            </div>
            <div className="form-row">
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " />
              <label htmlFor="register-email">Email</label>
            </div>
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
          <div className="form-row">
            {!aadhaarPhotoData ? (
              <motion.div className="upload-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="upload-head">Aadhaar Card Photo</div>
                <div
                  className="upload-dropzone"
                  onDragOver={(ev) => { ev.preventDefault() }}
                  onDrop={(ev) => {
                    ev.preventDefault()
                    const file = ev.dataTransfer.files?.[0]
                    if (file) handleAadhaarFile(file)
                  }}
                >
                  <div className="upload-text">
                    <span>Upload PNG/JPG/WebP (max 5MB)</span>
                  </div>
                  <div className="upload-actions">
                    <input
                      id="aadhaar-file"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleAadhaarFile(f)
                      }}
                    />
                    <button type="button" className="file-cta" onClick={() => document.getElementById('aadhaar-file')?.click()}>
                      Upload Photo
                    </button>
                  </div>
                  {aadhaarError && <div className="form-error small" style={{ marginTop: 8 }}>{aadhaarError}</div>}
                </div>
              </motion.div>
            ) : (
              <motion.div className="upload-preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="upload-thumb-wrap">
                  <img className="upload-thumb" src={aadhaarPhotoData} alt="Aadhaar preview" />
                  <button
                    type="button"
                    className="upload-clear"
                    aria-label="Clear Aadhaar photo"
                    onClick={() => { setAadhaarPhotoData(null); setAadhaarError('') }}
                  >
                    ×
                  </button>
                </div>
                <div className="upload-meta">
                  <div className="chip">Document attached</div>
                </div>
              </motion.div>
            )}
          </div>
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
