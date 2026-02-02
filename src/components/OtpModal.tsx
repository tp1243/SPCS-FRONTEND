import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiMail, FiClock, FiShield } from 'react-icons/fi'
import { api } from '../services/api'

type Purpose = 'register' | 'login'

type Props = {
  open: boolean
  purpose: Purpose
  email: string
  beginPayload?: { username?: string; password?: string; phone?: string }
  onClose: () => void
  onSuccess: (result: any) => void
}

export default function OtpModal({ open, purpose, email, beginPayload, onClose, onSuccess }: Props) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldownSec, setCooldownSec] = useState(0)
  const [expiresInSec, setExpiresInSec] = useState(300)
  const timerRef = useRef<number | null>(null)
  const cdRef = useRef<number | null>(null)
  const [cells, setCells] = useState<string[]>(['', '', '', '', '', ''])
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (!open) return
    setError('')
    setOtp('')
    setCooldownSec(0)
    setExpiresInSec(300)
    setCells(['', '', '', '', '', ''])
    ;(async () => {
      try {
        setLoading(true)
        if (purpose === 'register') {
          await api.registerBegin(String(beginPayload?.username || ''), email, String(beginPayload?.password || ''), beginPayload?.phone)
        } else {
          await api.loginBegin(email, String(beginPayload?.password || ''))
        }
        startTimers()
      } catch (e: any) {
        setError(e?.message || 'Failed to send OTP')
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (cdRef.current) window.clearInterval(cdRef.current)
    }
  }, [open])

  function startTimers() {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (cdRef.current) window.clearInterval(cdRef.current)
    setExpiresInSec(300)
    timerRef.current = window.setInterval(() => {
      setExpiresInSec((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
  }

  function onCellChange(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(0, 1)
    const next = [...cells]
    next[index] = v
    setCells(next)
    const joined = next.join('')
    setOtp(joined)
    if (v && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function onCellKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !cells[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
    if (e.key === 'Enter') onVerify()
  }

  function onCellsPaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = [...cells]
    for (let i = 0; i < 6 && index + i < 6; i++) next[index + i] = text[i] || ''
    setCells(next)
    const joined = next.join('')
    setOtp(joined)
    const target = Math.min(5, index + text.length)
    otpRefs.current[target]?.focus()
  }

  async function onVerify() {
    setError('')
    if (!otp || otp.trim().length !== 6) { setError('Enter the 6-digit OTP'); return }
    try {
      setLoading(true)
      if (purpose === 'register') {
        const res = await api.registerVerify(String(beginPayload?.username || ''), email, String(beginPayload?.password || ''), otp.trim(), beginPayload?.phone)
        onSuccess(res)
      } else {
        const res = await api.loginVerify(email, otp.trim())
        onSuccess(res)
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    setError('')
    if (cooldownSec > 0) return
    try {
      setLoading(true)
      await api.otpResend(email, purpose)
      setCooldownSec(60)
      if (cdRef.current) window.clearInterval(cdRef.current)
      cdRef.current = window.setInterval(() => {
        setCooldownSec((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      startTimers()
    } catch (e: any) {
      setError(e?.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const title = purpose === 'register' ? 'Verify your email' : 'Verify login'
  const sub = purpose === 'register' ? 'Enter the 6-digit OTP sent to your email' : 'Enter the 6-digit OTP sent to your registered email'
  const pct = Math.max(0, Math.min(100, Math.floor((expiresInSec / 300) * 100)))

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="biometric-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            backdropFilter: 'blur(8px)',
            background: 'radial-gradient(1200px 600px at 20% -10%, rgba(32,99,248,0.18), transparent), radial-gradient(1200px 600px at 120% 110%, rgba(255,129,64,0.18), transparent)',
          }}
        >
          <motion.div
            className="biometric-card"
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(20,22,26,0.9), rgba(20,22,26,0.85))',
            }}
          >
            <div className="biometric-header">
              <motion.div
                className="brand-mini"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
              >
                <motion.div
                  initial={{ rotate: -8, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                  style={{ display: 'grid', placeItems: 'center' }}
                >
                  <FiMail />
                </motion.div>
                <div>
                  <div className="brand-title">SPCS</div>
                  <div className="brand-sub">Smart Police Complaint System</div>
                </div>
              </motion.div>
              <button className="close-btn" onClick={onClose} aria-label="Close">
                <FiX />
              </button>
            </div>
            <div className="biometric-body">
              <div className="scan-left">
                <motion.div
                  className="otp-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiShield />
                    <h4 style={{ margin: 0 }}>{title}</h4>
                  </div>
                  <div className="muted">{sub}</div>
                  <div className="otp-grid" style={{ marginTop: 14 }}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <motion.input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el }}
                        className="otp-cell"
                        inputMode="numeric"
                        maxLength={1}
                        value={cells[i]}
                        onChange={(e) => onCellChange(i, e.target.value)}
                        onKeyDown={(e) => onCellKeyDown(i, e)}
                        onPaste={(e) => onCellsPaste(i, e)}
                        whileFocus={{ scale: 1.04, boxShadow: '0 0 0 3px rgba(99,102,241,0.35)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      />
                    ))}
                  </div>
                  {error && <div className="form-error small">{error}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <motion.button
                      className="btn primary"
                      onClick={onVerify}
                      disabled={loading || expiresInSec === 0}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </motion.button>
                    <motion.button
                      className="btn ghost"
                      onClick={onResend}
                      disabled={loading || cooldownSec > 0}
                      whileTap={{ scale: 0.98 }}
                    >
                      Resend {cooldownSec > 0 ? `(${cooldownSec}s)` : ''}
                    </motion.button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <FiClock /> Expires in {Math.max(0, expiresInSec)}s
                  </div>
                  <div style={{ marginTop: 8, width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                    <motion.div
                      style={{ height: 6, borderRadius: 999, background: 'linear-gradient(90deg, #6366F1, #22D3EE)' }}
                      initial={{ width: '100%' }}
                      animate={{ width: `${pct}%` }}
                      transition={{ ease: 'easeOut', duration: 0.25 }}
                    />
                  </div>
                </motion.div>
              </div>
              <div className="scan-right">
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  {title}
                </motion.h3>
                <motion.p
                  className="muted"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  One-time password verification with secure delivery
                </motion.p>
                <ul className="scan-steps">
                  <li>Check inbox</li>
                  <li>Enter OTP</li>
                  <li>Complete verification</li>
                </ul>
                <div className="actions">
                  <motion.button className="btn ghost" onClick={onClose} whileTap={{ scale: 0.98 }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
