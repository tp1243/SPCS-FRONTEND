import React, { useState, useRef } from 'react'

export default function AshokaPillar() {
  const spokes = Array.from({ length: 24 }, (_, i) => i)
  const [rx, setRx] = useState(0)
  const [ry, setRy] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    setRx((0.5 - y) * 8)
    setRy((x - 0.5) * 10)
  }
  const onLeave = () => { setRx(0); setRy(0) }

  return (
    <div className="ashoka-wrap" aria-label="Animated Ashoka Pillar">
      <div ref={ref} className="ashoka-card" onMouseMove={onMove} onMouseLeave={onLeave} style={{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        <div className="ashoka-sweep" aria-hidden="true" />
        <svg className="ashoka-svg" viewBox="0 0 200 400" role="img" aria-labelledby="ashokaTitle ashokaDesc">
          <title id="ashokaTitle">Ashoka Pillar</title>
        <desc id="ashokaDesc">A realistic, light-golden Ashoka pillar with subtle 3D shading and animation.</desc>
          <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7e1a0" />
            <stop offset="45%" stopColor="#e6c36f" />
            <stop offset="100%" stopColor="#b88a2f" />
          </linearGradient>
          <linearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="specular" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
        </defs>

        {/* Background subtle glow */}
        <rect x="0" y="0" width="200" height="400" fill="url(#glow)" />

        {/* Base plinth */}
        <rect x="40" y="340" width="120" height="24" rx="8" fill="url(#goldGrad)" />
        <rect x="50" y="328" width="100" height="14" rx="6" fill="url(#goldGrad)" />
        <ellipse cx="100" cy="366" rx="62" ry="10" fill="#000" opacity="0.25" />

        {/* Shaft (column) with slight taper */}
        <path d="M80 120 L120 120 L115 328 L85 328 Z" fill="url(#goldGrad)" />
        {/* Subtle vertical flutes */}
        {Array.from({ length: 14 }, (_, i) => 85 + i * 2).map((x, idx) => (
          <line key={idx} x1={x} y1={124} x2={x} y2={328} stroke="#8a6a22" strokeOpacity="0.25" />
        ))}
        {/* Vertical shadow to give depth */}
        <rect x="115" y="120" width="6" height="208" fill="url(#shadowGrad)" opacity="0.25" />
        {/* Specular highlight sweep */}
        <rect x="82" y="120" width="36" height="208" fill="url(#specular)" opacity="0.22" />

        {/* Capital base */}
        <rect x="70" y="98" width="60" height="18" rx="8" fill="url(#goldGrad)" />
        <rect x="64" y="86" width="72" height="14" rx="7" fill="url(#goldGrad)" />

        {/* Stylized Ashoka Chakra above the capital */}
        <g className="chakra" transform="translate(100, 58)">
          <circle r="22" fill="#253146" />
          <circle r="20" fill="none" stroke="#e6c36f" strokeWidth="2.5" />
          {spokes.map((s) => (
            <line key={s} x1="0" y1="0" x2="0" y2="18" stroke="#e6c36f" strokeWidth="1.6" transform={`rotate(${(360/24)*s})`} />
          ))}
          <circle r="3" fill="#e6c36f" />
        </g>

        {/* Suggestion of lion capital silhouette (abstract) */}
        <g className="capital" transform="translate(100, 120)">
          <ellipse cx="0" cy="-18" rx="26" ry="10" fill="url(#goldGrad)" />
          <ellipse cx="-16" cy="-6" rx="10" ry="6" fill="url(#goldGrad)" />
          <ellipse cx="16" cy="-6" rx="10" ry="6" fill="url(#goldGrad)" />
        </g>

        {/* Base inscription */}
        <g transform="translate(100, 382)" textAnchor="middle">
          <text fontSize="8" fill="#cfa84a" fontFamily="serif">सत्यमेव जयते</text>
        </g>
        </svg>
        <div className="ashoka-platform" aria-hidden="true" />
      </div>
    </div>
  )
}