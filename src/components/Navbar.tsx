import { useEffect, useState } from 'react'
import BrandIcon from './BrandIcon'
import { FiMenu, FiX, FiMoon, FiSun } from 'react-icons/fi'
import { Link } from 'react-router-dom'



const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How It Works' },
  { id: 'stats', label: 'Live Stats' },
  { id: 'testimonials', label: 'Feedback' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const light = stored === 'light'
    setIsLight(light)
    document.documentElement.classList.toggle('light-theme', light)
  }, [])

  const toggleTheme = () => {
    const next = !isLight
    setIsLight(next)
    document.documentElement.classList.toggle('light-theme', next)
    localStorage.setItem('theme', next ? 'light' : 'dark')
  }

  const handleNavClick = (id: string) => {
    setOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a
          className="logo"
          href="#home"
          aria-label="Smart Police Complaint System (SPCS)"
          onClick={(e) => { e.preventDefault(); handleNavClick('home') }}
        >
          <BrandIcon height={28} className="logo-icon" title="SPCS logo" />
          <span className="logo-text">SPCS</span>
        </a>
        <nav className="nav-items">
          {navItems.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); handleNavClick(n.id) }}>{n.label}</a>
          ))}
        </nav>
        <div className="nav-actions">
          <Link className="btn ghost" to="/login">Login</Link>
          <Link className="btn primary" to="/register">Register</Link>
          <a className="btn accent emergency" href="tel:100" title="Emergency 100">Emergency</a>
          <button className="btn ghost toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {isLight ? <FiMoon /> : <FiSun />}
          </button>
          <button className="hamburger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            {open ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mobile-menu">
          {navItems.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); handleNavClick(n.id) }}>{n.label}</a>
          ))}
          <div className="mobile-actions">
            <Link className="btn ghost" to="/login" onClick={() => setOpen(false)}>Login</Link>
            <Link className="btn primary" to="/register" onClick={() => setOpen(false)}>Register</Link>
            <a className="btn accent" href="tel:100">Emergency 100</a>
          </div>
        </div>
      )}
    </header>
  )
}