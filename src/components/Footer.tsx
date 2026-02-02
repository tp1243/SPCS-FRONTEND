import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand">
          <h2 className="footer-logo">SPCS</h2>
          <p>Smart, transparent, and secure police complaint system for everyone.</p>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Support Links */}
        <div className="footer-support">
          <h4>Support</h4>
          <ul>
            <li><a href="#faq">FAQs</a></li>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#terms">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* Social Icons */}
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a aria-label="Twitter" href="#"><FaTwitter /></a>
            <a aria-label="Facebook" href="#"><FaFacebook /></a>
            <a aria-label="Instagram" href="#"><FaInstagram /></a>
            <a aria-label="LinkedIn" href="#"><FaLinkedin /></a>
          </div>
        </div>
      </div>

      {/* Bottom Copy Section */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Smart Police Complaint System. All rights reserved.</p>
      </div>
    </footer>
  )
}
