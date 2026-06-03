import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contestAPI } from '../../utils/api';

function formatDateTime(value) {
  if (!value) {
    return 'Time TBD';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return 'Duration TBD';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours && minutes) {
    return `${hours}h ${minutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

// NEW HELPER: Generates the correct URL based on platform and ID
function getContestLink(platform, externalId) {
  if (platform === 'LEETCODE') return `https://leetcode.com/contest/${externalId}`;
  if (platform === 'CODEFORCES') return `https://codeforces.com/contest/${externalId}`;
  return '#'; 
}

export const UpcomingContestsPreview = () => {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadContests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await contestAPI.upcoming({ limit: 5 });
      setContests(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      setContests([]);
      setError(requestError.message || 'Unable to load upcoming contests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  return (
    <article className="dashboard-card dashboard-card-wide upcoming-preview-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Upcoming contests</p>
          <h2>Next 5 contests</h2>
        </div>
        <button type="button" onClick={loadContests} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="contest-list" aria-live="polite">
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-row" />
        </div>
      ) : error ? (
        <div className="card-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadContests}>
            Retry
          </button>
        </div>
      ) : contests.length === 0 ? (
        <p className="empty-state">No upcoming contests found.</p>
      ) : (
        <ul className="contest-list">
          {contests.map((contest) => (
            <li key={contest.id || `${contest.platform}-${contest.externalId}`}>
              <div>
                {/* NEW: Clickable Contest Name */}
                <a 
                  href={getContestLink(contest.platform, contest.externalId)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <strong style={{ cursor: 'pointer' }}>
                    {contest.name} <span style={{ color: '#3b82f6', fontSize: '0.85em', marginLeft: '4px' }}>↗</span>
                  </strong>
                </a>
                <span>
                  {contest.platform} - {formatDateTime(contest.startTime)}
                </span>
              </div>
              {contest.url ? (
                <a href={contest.url} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                <span>{formatDuration(contest.durationSeconds)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <Link className="secondary-action" to="/contests">
        View all contests
      </Link>
    </article>
  );
};

export default UpcomingContestsPreview;