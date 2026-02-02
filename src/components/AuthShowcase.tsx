import { motion } from 'framer-motion'
import { GiPoliceBadge } from 'react-icons/gi'
import { FaLock, FaBell, FaChartLine, FaMobileAlt, FaUserShield } from 'react-icons/fa'
import AuthVisual from './AuthVisual'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
  imageSrc?: string
  imageAlt?: string
}

export default function AuthShowcase({ title, subtitle, imageSrc, imageAlt }: Props) {
  return (
    <div className="auth-showcase">
      <div className="showcase-header">
        <div className="brand">
          <GiPoliceBadge className="brand-icon" />
          <div className="brand-text">
            <span className="brand-title">SPCS</span>
            <span className="brand-subtitle">Smart Police Complaint System</span>
          </div>
        </div>
      </div>

      {imageSrc ? (
        <motion.div className="auth-illustration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="back-pill"><Link to="/"><span>Back to website</span> <span aria-hidden>→</span></Link></div>
          <img src={imageSrc} alt={imageAlt || 'Smart policing illustration'} />
          <div className="overlay">
            <div className="tagline">Smart Policing, Trusted Service</div>
            <div className="slide-indicator">
              <span className="slide-dot" />
              <span className="slide-dot" />
              <span className="slide-dot active" />
            </div>
          </div>
        </motion.div>
      ) : (
        <AuthVisual title={title} subtitle={subtitle} />
      )}

      <motion.ul className="showcase-features" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <li className="feature-item"><FaLock className="feature-icon" /> Secure, privacy-first authentication</li>
        <li className="feature-item"><FaChartLine className="feature-icon" /> Real-time complaint tracking and analytics</li>
        <li className="feature-item"><FaBell className="feature-icon" /> Smart notifications and officer updates</li>
        <li className="feature-item"><FaMobileAlt className="feature-icon" /> Multi-device access with responsive design</li>
        <li className="feature-item"><FaUserShield className="feature-icon" /> Verified identities and safe data handling</li>
      </motion.ul>
    </div>
  )
}
