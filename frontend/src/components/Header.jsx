import { NavLink, Link, useNavigate } from 'react-router-dom'; // Make sure to import Link
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-header">
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
        {/* Changed this from a static span to a clickable Link */}
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