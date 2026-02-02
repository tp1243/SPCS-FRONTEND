import './App.css'
import './support.css'
import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
const LandingHeader = lazy(() => import('./components/LandingHeader'))
const Navbar = lazy(() => import('./components/Navbar'))
const Hero = lazy(() => import('./components/Hero'))
const Features = lazy(() => import('./components/Features'))
const HowItWorks = lazy(() => import('./components/HowItWorks'))
const Stats = lazy(() => import('./components/Stats'))
const Testimonials = lazy(() => import('./components/Testimonials'))
const About = lazy(() => import('./components/About'))
const Contact = lazy(() => import('./components/Contact'))
const Footer = lazy(() => import('./components/Footer'))
const FloatingSiren = lazy(() => import('./components/FloatingSiren'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const ProfileSettings = lazy(() => import('./pages/ProfileSettings'))
const PoliceDashboard = lazy(() => import('./pages/PoliceDashboard'))
const PoliceLogin = lazy(() => import('./pages/PoliceLogin'))
const PoliceRegister = lazy(() => import('./pages/PoliceRegister'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

function LandingPage() {
  return (
    <Suspense fallback={<div />}> 
      <div className="landing">
        <div className="show-desktop">
          <Navbar />
        </div>
        <div className="show-mobile">
          <LandingHeader />
        </div>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <About />
        <Contact />
        <Footer />
        <FloatingSiren />
      </div>
    </Suspense>
  )
}

function App() {
  return (
    <Suspense fallback={<div />}> 
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/police/login" element={<PoliceLogin />} />
        <Route path="/police/register" element={<PoliceRegister />} />
        <Route path="/police/dashboard" element={<PoliceDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile-settings" element={<ProfileSettings />} />
      </Routes>
    </Suspense>
  )
}

export default App;
