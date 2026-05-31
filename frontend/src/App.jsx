import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LinkedAccounts from './pages/LinkedAccounts';
import UpcomingContests from './pages/UpcomingContests';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <LinkedAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/linked-accounts"
              element={<Navigate to="/accounts" replace />}
            />
            <Route
              path="/contests"
              element={
                <ProtectedRoute>
                  <UpcomingContests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upcoming-contests"
              element={<Navigate to="/contests" replace />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
