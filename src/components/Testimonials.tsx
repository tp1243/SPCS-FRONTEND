import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../Testimonials.css";
import { FaUserShield, FaUserTie, FaUserFriends, FaQuoteLeft } from "react-icons/fa";
import { supportApi } from "../services/api";

const testimonials = [
  {
    author: "Amit Sharma",
    role: "Citizen",
    text: "Filed a complaint with photos and got updates within hours. Very transparent and efficient!",
    icon: <FaUserFriends />,
  },
  {
    author: "Inspector Rao",
    role: "Police Officer",
    text: "The dashboard improves our response time and makes case tracking organized and efficient.",
    icon: <FaUserShield />,
  },
  {
    author: "Neha Kulkarni",
    role: "Citizen",
    text: "Love the real-time tracking and professional look. It builds trust and reliability in the system.",
    icon: <FaUserTie />,
  },
  {
    author: "Raj Patel",
    role: "Citizen",
    text: "Filing complaints is effortless and the progress tracking makes me feel connected to justice.",
    icon: <FaUserFriends />,
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState<Array<{ id: string; username: string; text: string; rating: number; createdAt: string }>>([]);

  // Fetch latest feedback entries from Support API
  useEffect(() => {
    let active = true;
    supportApi
      .feedbackList()
      .then((r) => {
        if (!active) return;
        setFeedbacks((r.feedbacks || []).filter((f) => (f.text || "").trim().length > 0));
      })
      .catch(() => {
        // Fail silently and keep static testimonials as fallback
      });
    return () => {
      active = false;
    };
  }, []);

  // Choose dynamic feedback if available, otherwise fallback to static testimonials
  const items = useMemo(() => {
    if (feedbacks.length > 0) {
      return feedbacks.map((f) => ({
        author: f.username || "User",
        role: (f.username || "User") === "Anonymous" ? "Citizen" : "User",
        text: f.text,
        icon: <FaUserFriends />,
      }));
    }
    return testimonials;
  }, [feedbacks]);

  const step = items.length >= 2 ? 2 : 1;
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + step) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length, step]);

  const visibleTestimonials = items.length >= 2
    ? [items[index], items[(index + 1) % items.length]]
    : [items[index]];

  return (
    <section id="testimonials" className="testimonials-section">
      <div className="testimonials-overlay"></div>

      <div className="testimonials-header">
        <h2>What People Say</h2>
        <p>Real experiences shared by citizens and officers.</p>
      </div>

      <div className="testimonials-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="testimonial-grid"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6 }}
          >
            {visibleTestimonials.map((item, i) => (
              <motion.div
                key={i}
                className="testimonial-card"
                whileHover={{ scale: 1.03 }}
              >
                <div className="icon-wrapper">{item.icon}</div>
                <p className="testimonial-text">
                  <FaQuoteLeft className="quote-icon" /> {item.text}
                </p>
                <div className="testimonial-meta">
                  <div className="avatar">{item.author.charAt(0)}</div>
                  <div className="author-info">
                    <span className="author">{item.author}</span>
                    <span className="role">{item.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
