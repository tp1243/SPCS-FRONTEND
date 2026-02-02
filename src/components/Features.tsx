import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaCamera, FaClock, FaTachometerAlt, FaBell, FaLock } from 'react-icons/fa'
import '../Feature.css'



const features = [
  { icon: <FaMapMarkerAlt />, title: 'Live Location', desc: 'Report with accurate geolocation for faster response.' },
  { icon: <FaCamera />, title: 'Photo & Evidence', desc: 'Attach images or files to support your complaint.' },
  { icon: <FaClock />, title: 'Real-Time Tracking', desc: 'Track complaint progress in real time.' },
  { icon: <FaTachometerAlt />, title: 'Police Dashboard', desc: 'Officers manage, review, and act efficiently.' },
  { icon: <FaBell />, title: 'Notifications', desc: 'Get status updates and alerts instantly.' },
  { icon: <FaLock />, title: 'Transparency & Security', desc: 'Secure, auditable, and privacy-focused system.' },
]

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="section-header">
        <h2>Key Features</h2>
        <p>Smart digital tools that empower citizens and police.</p>
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="feature-card"
            whileHover={{ y: -6, boxShadow: '0 12px 30px rgba(14,165,233,0.25)' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}