import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { contestAPI } from '../utils/api';

const PLATFORM_OPTIONS = [
  { value: '', label: 'All platforms' },
  { value: 'CODEFORCES', label: 'Codeforces' },
  { value: 'LEETCODE', label: 'LeetCode' },
];

const DAY_OPTIONS = [
  { value: 7, label: 'Next 7 days' },
  { value: 30, label: 'Next 30 days' },
  { value: 90, label: 'Next 90 days' },
  { value: 180, label: 'Next 180 days' },
];

const LIMIT_OPTIONS = [5, 10, 20, 50];

function formatDateTime(value) {
  if (!value) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return 'TBD';
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

function formatPhase(value) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const UpcomingContests = () => {
  const [contests, setContests] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState('');
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = pagination.totalPages || 1;
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const resultSummary = useMemo(() => {
    if (pagination.total === 0) {
      return 'No contests found';
    }

    return `${pagination.total} contest${pagination.total === 1 ? '' : 's'} found`;
  }, [pagination.total]);

  const loadContests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await contestAPI.upcoming({ page, limit, days, platform });
      setContests(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          page,
          limit,
          total: Array.isArray(result.data) ? result.data.length : 0,
          totalPages: 1,
        },
      );
    } catch (requestError) {
      setContests([]);
      setPagination({ page, limit, total: 0, totalPages: 0 });
      setError(requestError.message || 'Unable to load contests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, [page, platform, days, limit]);

  const handlePlatformChange = (event) => {
    setPlatform(event.target.value);
    setPage(1);
  };

  const handleDaysChange = (event) => {
    setDays(Number(event.target.value));
    setPage(1);
  };

  const handleLimitChange = (event) => {
    setLimit(Number(event.target.value));
    setPage(1);
  };

  return (
    <>
      <Header />
      <main className="page-shell contests-shell">
        <section className="page-heading">
          <h1>Upcoming Contests</h1>
          <p>Browse upcoming contests by platform, time range, and page size.</p>
        </section>

        <section className="contest-controls panel-section" aria-label="Contest filters">
          <label htmlFor="platform-filter">
            Platform
            <select id="platform-filter" value={platform} onChange={handlePlatformChange}>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="days-filter">
            Days
            <select id="days-filter" value={days} onChange={handleDaysChange}>
              {DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="limit-selector">
            Limit
            <select id="limit-selector" value={limit} onChange={handleLimitChange}>
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={loadContests} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        <section className="panel-section contest-browser">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Contest browser</p>
              <h2>{resultSummary}</h2>
            </div>
            <span className="muted">
              Page {pagination.totalPages === 0 ? 0 : page} of {pagination.totalPages || 0}
            </span>
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
            <p className="empty-state">No upcoming contests match these filters.</p>
          ) : (
            <div className="contest-table-wrap">
              <table className="contest-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Platform</th>
                    <th>Phase</th>
                    <th>Start time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {contests.map((contest) => (
                    <tr key={contest.id || `${contest.platform}-${contest.externalId}`}>
                      <td>
                        <strong>{contest.name}</strong>
                      </td>
                      <td>{contest.platform}</td>
                      <td>{formatPhase(contest.phase)}</td>
                      <td>{formatDateTime(contest.startTime)}</td>
                      <td>{formatDuration(contest.durationSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pagination-controls" aria-label="Contest pagination">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={isLoading || !hasPreviousPage}
            >
              Previous
            </button>
            <span>
              Page {pagination.totalPages === 0 ? 0 : page} of {pagination.totalPages || 0}
            </span>
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={isLoading || !hasNextPage}
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default UpcomingContests;
