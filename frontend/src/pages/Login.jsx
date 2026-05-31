import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { clearError, error, isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return 'Please enter a valid email';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch {
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <h1 id="login-title">Login</h1>
        <p>Track coding contests from one protected workspace.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {(formError || error) && (
            <div className="error-alert" role="alert">
              {formError || error}
            </div>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFormError('')}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={isLoading}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFormError('')}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
