import { ShieldCheck, Users, Zap } from 'lucide-react'
import "../About.css";

export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-container">
        <div className="about-header">
          <h2>About Smart Police Complaint System</h2>
          <p>Empowering citizens and police through transparency, speed, and technology.</p>
        </div>

        <div className="about-cards">
          <div className="about-card">
            <div className="icon">
              <ShieldCheck className="icon-style" />
            </div>
            <h3>Transparency</h3>
            <p>
              Every complaint is tracked in real-time, ensuring citizens can follow the
              progress of their reports with full visibility and trust.
            </p>
          </div>

          <div className="about-card">
            <div className="icon">
              <Users className="icon-style cyan" />
            </div>
            <h3>Community</h3>
            <p>
              Bridging citizens and law enforcement to work collaboratively in maintaining
              public safety and mutual accountability.
            </p>
          </div>

          <div className="about-card">
            <div className="icon">
              <Zap className="icon-style blue" />
            </div>
            <h3>Efficiency</h3>
            <p>
              Smart automation speeds up complaint handling and reduces manual errors,
              making justice faster and more efficient.
            </p>
          </div>
        </div>

        <div className="about-mission">
          <p>
            <span className="highlight">Our mission</span> is to redefine the way complaints
            are registered, managed, and resolved — ensuring fairness, transparency, and
            accountability at every step.
          </p>
        </div>
      </div>
    </section>
  )
}
