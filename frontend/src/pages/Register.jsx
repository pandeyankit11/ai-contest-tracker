import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const navigate = useNavigate();
  const { clearError, error, isAuthenticated, isLoading, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      return 'Please enter a valid email';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
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
      await register(email.trim(), password,confirmPassword);
      navigate('/dashboard', { replace: true });
    } catch {
      setConfirmPassword('');
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <section className="auth-panel" aria-labelledby="register-title">
        <h1 id="register-title">Register</h1>
        <p>Create your contest tracking account.</p>

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
            autoComplete="new-password"
            disabled={isLoading}
          />

          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFormError('')}
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={isLoading}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </section>
    </div>
  );
};

export default Register;
