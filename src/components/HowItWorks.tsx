import { motion } from "framer-motion";
import { FaUserEdit, FaBuilding, FaTasks, FaBell } from "react-icons/fa";
import "../HowIt.css";

const steps = [
  {
    icon: <FaUserEdit />,
    title: "Submit Complaint",
    desc: "Easily submit your complaint with a description, photo, and live location.",
  },
  {
    icon: <FaBuilding />,
    title: "Auto Routing",
    desc: "The system intelligently routes your complaint to the nearest police station.",
  },
  {
    icon: <FaTasks />,
    title: "Police Review",
    desc: "Assigned officers review, update, and take necessary actions on your complaint.",
  },
  {
    icon: <FaBell />,
    title: "Track & Alerts",
    desc: "Track your complaint status in real-time and receive instant updates actions on  complaint.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how-section">
      <div className="how-header">
        <h2>How It Works</h2>
        <p>Simple, transparent flow from report to resolution.</p>
      </div>

      <div className="how-scroll-container">
        <div className="how-line-horizontal"></div>
        <div className="how-row">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="how-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="how-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {i < steps.length - 1 && <div className="arrow">→</div>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
