import { useEffect, useState } from 'react'

type Props = {
  message: string
  type?: 'success' | 'error' | 'info'
  durationMs?: number
  onClose?: () => void
}

export default function NotificationToast({ message, type = 'info', durationMs = 3000, onClose }: Props) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => { setVisible(false); onClose?.() }, durationMs)
    return () => clearTimeout(id)
  }, [durationMs, onClose])

  if (!visible) return null
  return <div className={`toast ${type}`} role="status" aria-live="polite">{message}</div>
}