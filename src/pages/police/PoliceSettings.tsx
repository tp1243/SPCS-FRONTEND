import { useEffect, useMemo, useState } from 'react'
import { policeApi } from '../../services/police'
import type { PoliceOfficerProfile, PoliceStation } from '../../types'
import '../../police-settings.css'

type Props = { token: string }

export default function PoliceSettings({ token }: Props) {
  const [officer, setOfficer] = useState<PoliceOfficerProfile | null>(null)
  const [stations, setStations] = useState<PoliceStation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [updatingPwd, setUpdatingPwd] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const [requestingUpdate, setRequestingUpdate] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined)

  useEffect(() => {
    let mounted = true
    policeApi.profile(token)
      .then((res) => { if (mounted) setOfficer(res as any) })
      .catch((err) => setError(err.message || 'Failed to load profile'))
    policeApi.listStations(token)
      .then((res) => setStations(res.stations || []))
      .catch(() => {})
    return () => { mounted = false }
  }, [token])

  const stationInfo = useMemo(() => {
    if (!officer) return null
    return stations.find((s) => s.name === officer.station) || null
  }, [stations, officer])

  async function saveProfile() {
    if (!officer) return
    setSaving(true)
    try {
      const payload: Partial<PoliceOfficerProfile> = {
        name: officer.name,
        rank: officer.rank,
        phone: officer.phone,
        city: officer.city,
        avatarUrl: avatarPreview || officer.avatarUrl,
        status: officer.status,
      }
      const res = await policeApi.updateProfile(token, payload)
      setOfficer(res as any)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    }
    setSaving(false)
  }

  async function changePassword() {
    setUpdatingPwd(true)
    try {
      if (!pwd.currentPassword || !pwd.newPassword || !pwd.confirm) throw new Error('Fill all fields')
      if (pwd.newPassword !== pwd.confirm) throw new Error('New passwords do not match')
      await policeApi.changePassword(token, pwd.currentPassword, pwd.newPassword)
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    }
    setUpdatingPwd(false)
  }

  async function toggle2FA(enable: boolean) {
    try {
      const res = await policeApi.enable2FA(token, enable)
      setOfficer((prev) => prev ? { ...prev, twoFactorEnabled: res.twoFactorEnabled } : prev)
    } catch (err: any) {
      setError(err.message || 'Failed to update 2FA')
    }
  }

  async function logoutAll() {
    try { await policeApi.logoutAll(token) } catch (err: any) { setError(err.message || 'Failed to logout all') }
  }

  async function requestStationUpdate() {
    if (!officer) return
    setRequestingUpdate(true)
    try {
      await policeApi.requestStationUpdate(token, { stationName: officer.station, message: updateMsg })
      setUpdateMsg('')
    } catch (err: any) {
      setError(err.message || 'Failed to request update')
    }
    setRequestingUpdate(false)
  }

  function onAvatarSelected(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="panel">
      <div className="label">Settings & Profile</div>
      {error && <div className="form-error">{error}</div>}
      {!officer ? (
        <div className="muted">Loading profile…</div>
      ) : (
        <div className="settings-grid">
          {/* Officer Information */}
          <section className="settings-section">
            <div className="settings-header">Officer Information <span className="badge-icon">🎖️</span></div>
            <div className="settings-card">
              <div className="avatar-wrapper">
                <img className="avatar" src={avatarPreview || officer.avatarUrl || 'https://via.placeholder.com/64'} alt="avatar" />
                <label className="btn ghost">
                  Upload New Profile Picture
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onAvatarSelected(e.target.files?.[0])} />
                </label>
              </div>
              <div className="field-row">
                <div className="label">Name</div>
                <input className="input" value={officer.name || ''} onChange={(e) => setOfficer({ ...officer, name: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Rank</div>
                <input className="input" value={officer.rank || ''} onChange={(e) => setOfficer({ ...officer, rank: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Email</div>
                <input className="input" value={officer.email} readOnly />
                <div className="muted-small">non-editable</div>
              </div>
              <div className="field-row">
                <div className="label">Contact</div>
                <input className="input" value={officer.phone || ''} onChange={(e) => setOfficer({ ...officer, phone: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Assigned Station</div>
                <input className="input" value={officer.station} readOnly />
                <div className="muted-small">view only</div>
              </div>
              <div className="field-row">
                <div className="label">City</div>
                <input className="input" value={officer.city || 'Navi Mumbai'} onChange={(e) => setOfficer({ ...officer, city: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Last Login</div>
                <input className="input" value={officer.lastLoginAt ? new Date(officer.lastLoginAt).toLocaleString() : '—'} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="btn-group">
                <button className="btn" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>
          </section>

          {/* Station Information */}
          <section className="settings-section">
            <div className="settings-header">Station Information</div>
            <div className="settings-card">
              <div className="field-row">
                <div className="label">Station Name</div>
                <input className="input" value={stationInfo?.name || officer.station} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Address</div>
                <input className="input" value={stationInfo?.address || 'N/A'} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">City</div>
                <input className="input" value={officer.city || 'Navi Mumbai'} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Jurisdiction Area</div>
                <input className="input" value={stationInfo?.zone || stationInfo?.division || 'Navi Mumbai'} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Station Contact</div>
                <input className="input" value={'N/A'} readOnly />
                <div className="muted-small"></div>
              </div>
              <div className="map-wrapper">
                {stationInfo?.lat && stationInfo?.lng ? (
                  <iframe title="station-map" src={`https://maps.google.com/maps?q=${stationInfo.lat},${stationInfo.lng}&z=15&output=embed`} />
                ) : (
                  <div className="muted">Map unavailable</div>
                )}
              </div>
              <textarea className="input" placeholder="Add note for update request (optional)" value={updateMsg} onChange={(e) => setUpdateMsg(e.target.value)} />
              <div className="btn-group">
                <button className="btn ghost" onClick={requestStationUpdate} disabled={requestingUpdate}>{requestingUpdate ? 'Requesting…' : 'Request Update'}</button>
              </div>
            </div>
          </section>

          {/* Security & Password Settings */}
          <section className="settings-section">
            <div className="settings-header">Security & Password</div>
            <div className="settings-card">
              <div className="field-row">
                <div className="label">Current Password</div>
                <input className="input" type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">New Password</div>
                <input className="input" type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="field-row">
                <div className="label">Confirm New</div>
                <input className="input" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
                <div className="muted-small"></div>
              </div>
              <div className="btn-group">
                <button className="btn" onClick={changePassword} disabled={updatingPwd}>{updatingPwd ? 'Updating…' : 'Change Password'}</button>
                <button className="btn ghost" onClick={() => toggle2FA(!(officer.twoFactorEnabled))}>{officer.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}</button>
                <button className="btn danger ghost" onClick={logoutAll}>Logout of all devices</button>
              </div>
              <div className="divider" />
              <div className="history-list">
                <div className="muted-small">Last Login Details & Devices</div>
                <div className="history-item">
                  <span>{officer.lastLoginAt ? new Date(officer.lastLoginAt).toLocaleString() : '—'}</span>
                  <span>• {officer.lastLoginIp || '—'}</span>
                  <span>• {officer.lastLoginAgent || '—'}</span>
                </div>
                {(officer.loginHistory || []).slice(-5).reverse().map((h, idx) => (
                  <div key={idx} className="history-item">
                    <span>{h.at ? new Date(h.at).toLocaleString() : '—'}</span>
                    <span>• {h.ip || '—'}</span>
                    <span>• {h.userAgent || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}