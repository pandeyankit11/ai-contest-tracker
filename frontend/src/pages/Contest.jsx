import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Contests = () => {
  const { token } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/contests/history', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch contest history');
        }

        setContests(data.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Contest fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchContests();
    }
  }, [token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-shell">
          <div className="page-heading">
            <h1>Contest History</h1>
          </div>
          <div className="skeleton" style={{ height: '300px', width: '100%' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-shell" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="page-heading" style={{ marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--text-h)', marginBottom: '8px' }}>Contest History</h1>
          <p style={{ color: 'var(--text-soft)' }}>Review your past contest performances and rank updates</p>
        </div>

        {/* LEETCODE COMING SOON BANNER */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '24px' }}>🚀</div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#f8fafc', fontSize: '15px' }}>LeetCode History Coming Soon</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              Currently, this table displays your Codeforces contest history. Full support for tracking individual LeetCode contest performances is in development!
            </p>
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</div>}

        {contests.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-soft)' }}>No contest participations synced yet.</p>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginTop: '8px' }}>
              Go to the Analytics page and click "Sync Data" to populate your history.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', color: 'var(--text-h)', background: 'rgba(15, 23, 42, 0.2)' }}>
                  <th style={{ padding: '16px' }}>Date</th>
                  <th style={{ padding: '16px' }}>Platform</th>
                  <th style={{ padding: '16px' }}>Contest ID</th>
                  <th style={{ padding: '16px' }}>Rank</th>
                  <th style={{ padding: '16px' }}>Rating Change</th>
                  <th style={{ padding: '16px' }}>New Rating</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((contest) => {
                  const isPositive = contest.ratingChange >= 0;
                  return (
                    <tr key={contest.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.05)', color: 'var(--text-soft)' }}>
                      <td style={{ padding: '16px' }}>{formatDate(contest.participatedAt)}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {contest.platform}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>#{contest.externalContestId}</td>
                      <td style={{ padding: '16px', color: 'var(--text-h)', fontWeight: '500' }}>{contest.rank}</td>
                      <td style={{ padding: '16px', color: isPositive ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {isPositive ? `+${contest.ratingChange}` : contest.ratingChange}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-h)' }}>{contest.newRating}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
};

export default Contests;