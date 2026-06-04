import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  // --- NEW: State to track if the page is scrolled ---
  const [isScrolled, setIsScrolled] = useState(false);

  // --- NEW: Scroll listener to toggle the glassmorphism effect ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header 
      className="app-header"
      style={{
        // 1. Lock the header to the top of the screen
        position: 'sticky',
        top: 0,
        zIndex: 1000, 
        
        // 2. The Glassmorphism Magic
        background: isScrolled ? 'rgba(15, 20, 30, 0.65)' : '', // Falls back to your CSS background when at the top
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none', // For Safari support
        borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
        
        // 3. Smooth fade animation
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease'
      }}
    >
      <NavLink className="brand" to="/dashboard">
        <span className="brand-mark">AI</span>
        <span>Contest Tracker</span>
      </NavLink>

      <nav className="app-nav" aria-label="Primary navigation">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/accounts">Accounts</NavLink>
        <NavLink to="/contests">Contests</NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
      </nav>

      <div className="user-menu">
        <Link 
          to="/profile" 
          title="Go to Profile"
          style={{ 
            color: '#9ca3af', 
            textDecoration: 'none', 
            fontWeight: '500',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#f3f4f6'}
          onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
        >
          {user?.email}
        </Link>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;