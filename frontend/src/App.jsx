import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';

import Landing from './pages/Landing'; // NEW IMPORT
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LinkedAccounts from './pages/LinkedAccounts';
import UpcomingContests from './pages/UpcomingContests';
import Analytics from './pages/Analytics';
import ContestHistory from './pages/Contest'; 
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <div className="app-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute><LinkedAccounts /></ProtectedRoute>} />
              <Route path="/linked-accounts" element={<Navigate to="/accounts" replace />} />
              
              <Route path="/contests" element={<ProtectedRoute><UpcomingContests /></ProtectedRoute>} />
              <Route path="/upcoming-contests" element={<Navigate to="/contests" replace />} />

              <Route path="/history" element={<ProtectedRoute><ContestHistory /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              
              {/* Catch-all: Redirect unknown public URLs to Landing instead of Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;