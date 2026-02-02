import { motion, useMotionValue, useTransform } from 'framer-motion'
import { FaShieldAlt } from 'react-icons/fa'
import { GiPoliceBadge } from 'react-icons/gi'

type AuthVisualProps = {
  title: string
  subtitle?: string
}

export default function AuthVisual({ title, subtitle }: AuthVisualProps) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotate = useTransform(mx, [ -50, 50 ], [ -6, 6 ])
  const glowX = useTransform(mx, [ -50, 50 ], [ '10%', '80%' ])
  const glowY = useTransform(my, [ -50, 50 ], [ '10%', '70%' ])

  return (
    <div className="auth-visual-pro">
      <motion.div className="visual-stage" onMouseMove={(e) => { const rect = (e.target as HTMLElement).getBoundingClientRect(); mx.set(e.clientX - rect.left - rect.width/2); my.set(e.clientY - rect.top - rect.height/2) }}>
        <motion.div className="orb orb-blue" style={{ rotate }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }} transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div className="orb orb-red"
          animate={{ y: [0, -8, 0], x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 8 }}
        />
        <motion.div className="glow" style={{ left: glowX, top: glowY }} />
        <motion.div className="badge-wrap" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
          <GiPoliceBadge className="badge-icon" />
        </motion.div>
        <motion.div className="shield" style={{ rotate }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <FaShieldAlt size={46} />
        </motion.div>
      </motion.div>
      <div className="visual-text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  )
}