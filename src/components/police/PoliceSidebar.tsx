import { FiHome, FiList, FiClock, FiCheckCircle, FiSettings, FiLogOut, FiBell, FiAlertCircle, FiTag } from 'react-icons/fi'
// import { useState } from 'react'

type Props = {
  active: string
  onChange: (key: string) => void
  onLogout: () => void
}

const items = [
  { key: 'overview', label: 'Dashboard Overview', icon: FiHome },
  { key: 'active', label: 'Active Complaints', icon: FiClock },
  { key: 'pending', label: 'Pending Complaints', icon: FiList },
  { key: 'fir', label: 'FIR Complaints', icon: FiAlertCircle },
  { key: 'non-fir', label: 'Non-FIR Complaints', icon: FiTag },
  { key: 'completed', label: 'Completed Cases', icon: FiCheckCircle },
  { key: 'notifications', label: 'Notifications / Updates', icon: FiBell },
  { key: 'settings', label: 'Settings & Profile', icon: FiSettings },
]

export default function PoliceSidebar({ active, onChange, onLogout }: Props) {
  return (
    <aside className="dash-sidebar">
      <nav>
        {items.map(it => {
          const Icon = it.icon
          return (
            <button key={it.key} className={`side-item ${active === it.key ? 'active' : ''}`} onClick={() => onChange(it.key)}>
              <Icon />
              <span>{it.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="side-footer">
        <button className="side-item" onClick={onLogout}>
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}