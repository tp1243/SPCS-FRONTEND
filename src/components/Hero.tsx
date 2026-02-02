import { motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section id="home" className="hero">
      {/* 3D background gradient + particles */}
      <div className="hero-bg">
        <div className="layer layer1"></div>
        <div className="layer layer2"></div>
        <div className="layer layer3"></div>
      </div>

      <div className="hero-inner">
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="hero-content"
        >
          <motion.div
            className="hero-icon"
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.1, 1],
              filter: [
                "drop-shadow(0 0 6px #00c6ff)",
                "drop-shadow(0 0 20px #00ffff)",
                "drop-shadow(0 0 6px #00c6ff)",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "easeInOut",
            }}
          >
            <FaShieldAlt size={80} />
          </motion.div>

          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Report Crimes Instantly. <br />
            <span className="highlight">Help Build a Safer Community.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Smart Police Complaint System connects citizens and police for
            faster, transparent action.
          </motion.p>

          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button
              className="btn primary"
              onClick={() => navigate("/user")}
            >
              Report Incident
            </button>
            <button
              className="btn accent"
              onClick={() => navigate("/police/login")}
            >
              View Complaints (For Police)
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
