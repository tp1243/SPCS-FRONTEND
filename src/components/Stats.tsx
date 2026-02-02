import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import '../stats.css'
import { request } from '../services/api'

type Stat = { label: string; value: number; emoji?: string }

type SystemStatsResponse = {
  stats: {
    totalComplaints: number
    casesSolved: number
    activeOfficers: number
    complaintsPending: number
  }
}

export default function Stats() {
  const [items, setItems] = useState<Stat[]>([
    { label: 'Total Complaints Registered', value: 0, emoji: '✅' },
    { label: 'Cases Solved', value: 0, emoji: '👮' },
    { label: 'Active Officers', value: 0, emoji: '👥' },
    { label: 'Complaints Pending', value: 0, emoji: '⚠️' },
  ])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    request<SystemStatsResponse>('/stats', { method: 'GET' })
      .then((res) => {
        if (!mounted) return
        setItems([
          { label: 'Total Complaints Registered', value: res.stats.totalComplaints, emoji: '✅' },
          { label: 'Cases Solved', value: res.stats.casesSolved, emoji: '👮' },
          { label: 'Active Officers', value: res.stats.activeOfficers, emoji: '👥' },
          { label: 'Complaints Pending', value: res.stats.complaintsPending, emoji: '⚠️' },
        ])
        setLoaded(true)
      })
      .catch((_err) => {
        // Keep default zeros on error to avoid UI break
        setLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section id="stats" className={`stats-section ${loaded ? '' : 'loading'}`}>
      <div className="stats-overlay"></div>

      <div className="stats-header">
        <h2>System Live Statistics</h2>
        <p>Dynamic insights into ongoing operations and performance metrics.</p>
      </div>

      <div className="stats-grid">
        {items.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <div className="stat-emoji">{s.emoji}</div>
            <div className="stat-value">
              <CountUp end={s.value} duration={2} separator="," />
            </div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <p className="stat-note">
        <span>⚡</span> Powered by Smart Police Complaint System – enabling real-time monitoring.
      </p>
    </section>
  )
}
