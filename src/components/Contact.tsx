import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaEnvelope, FaUser, FaCommentDots, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa'
import '../Contact.css'


export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      alert('⚠️ Please fill in all fields.')
      return
    }
    console.log('Contact form submitted:', { name, email, message })
    alert('✅ Message submitted. Our team will get back to you soon.')
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <section id="contact" className="contact-section">
      <motion.div
        className="contact-header"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Contact Us</h2>
        <p>Need assistance or want to report an issue? Reach out to our team anytime.</p>
      </motion.div>

      <div className="contact-container">
        <motion.form
          className="contact-form"
          onSubmit={onSubmit}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="form-group">
            <FaUser className="input-icon" />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
            />
          </div>
          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
            />
          </div>
          <div className="form-group">
            <FaCommentDots className="input-icon" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="btn-submit"
          >
            Send Message
          </motion.button>
        </motion.form>

        <motion.div
          className="contact-map"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <iframe
            title="Police HQ"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.948036270738!2d72.835938!3d19.071401!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8c7e5c9e5b5%3A0x3b3b7e!2sMaharashtra%20Police%20Headquarters!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="300"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="contact-info">
            <div className="info-item">
              <FaMapMarkerAlt /> <span>Maharashtra Police Headquarters</span>
            </div>
            <div className="info-item">
              <FaPhoneAlt /> <span>Emergency: <a href="tel:100">100</a> / <a href="tel:112">112</a></span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
