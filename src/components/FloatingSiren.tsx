import { RiPoliceCarFill } from 'react-icons/ri'

export default function FloatingSiren() {
  return (
    <a className="floating-siren" href="#contact" title="Need help? Contact us" onClick={(e) => {
      e.preventDefault();
      const el = document.getElementById('contact')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }}>
      <RiPoliceCarFill size={24} />
    </a>
  )
}