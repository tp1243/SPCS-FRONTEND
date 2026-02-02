# SPCS Brand Style Guide

This guide documents the logo usage, color palette, typography, spacing, and accessibility requirements for the Smart Police Complaint System (SPCS).

## Logo Variants
- Primary (icon + wordmark): `src/assets/logo.svg`
- Icon-only: `src/assets/logo-icon.svg`
- Text-only: `src/assets/logo-text.svg`

## Color Palette
- Background: `#1A1A1A` (`var(--bg)`)
- Surface: `#141414` (`var(--surface)`)
- Surface Alt: `#1F1F1F` (`var(--surface-2)`)
- Text: `#E6E6E6` (`var(--text)`)
- Accent/Primary: `#CCCCCC` (`var(--primary)`)
- Muted: `#B3B3B3` (`var(--muted)`)
- Border: `#333333` (`var(--border)`)

Light theme overrides (optional):
- Background: `#F2F2F2`
- Surface: `#FFFFFF`
- Surface Alt: `#F7F7F7`
- Text: `#1A1A1A`
- Accent/Primary: `#222222`
- Muted: `#555555`
- Border: `#DDDDDD`

## Typography
- Wordmark font: `Inter, Segoe UI, Roboto, system-ui, sans-serif`
- Weight: 700 (bold)
- Letter spacing: +1px for clarity at small sizes

## Spacing & Sizing
- Navbar logo height: 24–32px (recommended `28px`)
- Gap between icon and wordmark: `8px`
- Minimum clear space: `0.5×` logo height around all sides
- Minimum rendered size: `20px` icon-only for small UI elements

## Accessibility
- Provide descriptive alternative text: "Smart Police Complaint System (SPCS) logo"
- Inline SVG includes `<title>` for screen readers
- Maintain WCAG AA contrast ratio between logo and background (the provided palette meets AA in dark mode)

## Performance
- SVG is preferred for scalability and crisp rendering
- Avoid large filters or embedded images in SVG to keep file size small
- Use inline SVG with CSS variables to align with theme and reduce additional requests if needed

## Implementation
- Use the React `BrandIcon` component for inline logo rendering in navbars:

```tsx
import BrandIcon from '../components/BrandIcon'

<a className="logo" aria-label="Smart Police Complaint System (SPCS)">
  <BrandIcon height={28} className="logo-icon" title="SPCS logo" />
  <span className="logo-text">SPCS</span>
  {/* optional: add a visually-hidden span for accessibility */}
</a>
```

- For asset usage outside React, reference `src/assets/logo.svg` and include `alt` text.

## Do/Don’t
- Do keep proportions and spacing consistent.
- Do use provided colors to match the site theme.
- Don’t recolor the icon with low-contrast values.
- Don’t stretch or skew the logo.