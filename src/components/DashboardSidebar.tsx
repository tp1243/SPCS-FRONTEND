import { FiHome, FiAlertCircle, FiList, FiMap, FiBell, FiUser, FiHelpCircle, FiStar, FiLogOut } from 'react-icons/fi'
import { useI18n } from './i18n'

type Props = {
  active: string
  onChange: (key: string) => void
}

const items = [
  { key: 'overview', labelKey: 'sidebar_overview', icon: FiHome },
  { key: 'new', labelKey: 'sidebar_new', icon: FiAlertCircle },
  { key: 'my', labelKey: 'sidebar_my', icon: FiList },
  { key: 'track', labelKey: 'sidebar_track', icon: FiMap },
  { key: 'notifications', labelKey: 'sidebar_notifications', icon: FiBell },
  { key: 'profile', labelKey: 'sidebar_profile', icon: FiUser },
  { key: 'support', labelKey: 'sidebar_support', icon: FiHelpCircle },
  { key: 'feedback', labelKey: 'sidebar_feedback', icon: FiStar },
]

export default function DashboardSidebar({ active, onChange }: Props) {
  const { t } = useI18n()
  return (
    <aside className="dash-sidebar">
      <nav>
        {items.map(it => {
          const Icon = it.icon
          return (
            <button key={it.key} className={`side-item ${active === it.key ? 'active' : ''}`} onClick={() => onChange(it.key)}>
              <Icon />
              <span>{t(it.labelKey)}</span>
            </button>
          )
        })}
        <div className="spacer" />
        <a className="side-item" href="/" title="Logout redirects to home">
          <FiLogOut />
          <span>{t('logout_link')}</span>
        </a>
      </nav>
    </aside>
  )
}
