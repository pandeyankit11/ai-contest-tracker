import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LinkedAccounts from './pages/LinkedAccounts';
import UpcomingContests from './pages/UpcomingContests';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="app">
        <nav>
          <h1>AI Contest Tracker</h1>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/login">Login</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </nav>

        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/linked-accounts"
              element={
                <ProtectedRoute>
                  <LinkedAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upcoming-contests"
              element={
                <ProtectedRoute>
                  <UpcomingContests />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>

        <footer>
          <p>&copy; 2024 AI Contest Tracker. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
