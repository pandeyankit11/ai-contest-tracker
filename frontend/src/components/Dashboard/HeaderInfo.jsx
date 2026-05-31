import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export const HeaderInfo = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [isLoading, setIsLoading] = useState(!authUser);
  const [error, setError] = useState('');

  const loadUser = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await authAPI.me();
      setUser(data.user);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load user information');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboard-hero dashboard-card" aria-live="polite">
        <div>
          <p className="eyebrow">Dashboard</p>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-hero dashboard-card">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome back{user?.email ? `, ${user.email}` : ''}</h1>
        <p>
          Account created: <strong>{formatDate(user?.createdAt)}</strong>
        </p>
      </div>

      {error ? (
        <div className="inline-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadUser}>
            Retry
          </button>
        </div>
      ) : (
        <Link className="secondary-action" to="/accounts">
          Manage accounts
        </Link>
      )}
    </section>
  );
};

export default HeaderInfo;
