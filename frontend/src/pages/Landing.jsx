import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Landing = () => {
  const { token } = useAuth();

  // If the user is already logged in, send them straight to the app
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="logo-icon">AI</span> Contest Tracker
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      <main className="landing-hero">
        <h1 className="hero-title">
          Track Your Coding Progress <br/> <span className="highlight">Across All Platforms</span>
        </h1>
        <p className="hero-subtitle">
          Unify your Codeforces and LeetCode stats. Analyze your rating growth, spot your weaknesses, and never miss an upcoming contest.
        </p>
        
        <div className="hero-cta">
          <Link to="/register" className="btn-primary btn-large">Start Tracking Free</Link>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>🏆 Contest Tracking</h3>
            <p>Sync your entire contest history and view upcoming global competitions in one place.</p>
          </div>
          <div className="feature-card">
            <h3>📈 Deep Analytics</h3>
            <p>Visualize your topic mastery and difficulty breakdown with beautiful, interactive charts.</p>
          </div>
          <div className="feature-card">
            <h3>🔥 Rating Growth</h3>
            <p>Track your historical rating changes and activity heatmaps to maintain your coding streak.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;