import { useEffect, useState } from 'react'
import BrandIcon from './BrandIcon'
import { Link } from 'react-router-dom'

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`landing-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="landing-inner" role="navigation" aria-label="Landing header">
        <Link to="/" className="logo landing-logo" aria-label="Smart Police Complaint System (SPCS)">
          <BrandIcon height={28} className="logo-icon" title="SPCS logo" />
          <span className="logo-text">SPCS</span>
        </Link>
        <div className="landing-actions">
          <Link className="btn ghost" to="/login" aria-label="Login">Login</Link>
          <Link className="btn primary" to="/register" aria-label="Register">Register</Link>
        </div>
      </div>
    </header>
  )
}