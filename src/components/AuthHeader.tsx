import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandIcon from './BrandIcon'

type Props = {
  variant: 'login' | 'register'
}

export default function AuthHeader({ variant }: Props) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLogin = variant === 'login'

  return (
    <header className={`auth-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="auth-nav-inner">
        <Link to="/" className="logo" aria-label="Smart Police Complaint System (SPCS)">
          <BrandIcon height={26} className="logo-icon" title="SPCS logo" />
          <span className="logo-text">SPCS</span>
        </Link>
        <div className="auth-nav-actions">
          {isLogin ? (
            <Link className="btn primary" to="/register">Register</Link>
          ) : (
            <Link className="btn ghost" to="/login">Login</Link>
          )}
        </div>
      </div>
    </header>
  )
}