// import React from 'react'

type Props = {
  height?: number
  className?: string
  title?: string
}

export default function BrandIcon({ height = 28, className, title = 'Smart Police Complaint System (SPCS) logo' }: Props) {
  return (
    <svg
      role="img"
      aria-label={title}
      width={height}
      height={height}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>{title}</title>
      <path
        d="M12 2l8 4v7c0 4.418-3.582 8-8 9-4.418-1-8-4.582-8-9V6l8-4z"
        fill="none"
        stroke="var(--text)"
        strokeWidth="1.7"
      />
      <path
        d="M9 12l2 2 4-4"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}