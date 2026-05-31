import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformAPI } from '../../utils/api';

const PLATFORMS = ['CODEFORCES', 'LEETCODE'];
const ACCOUNTS_CHANGED_EVENT = 'platform-accounts:changed';

function formatPlatform(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const LinkedAccountsSummary = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await platformAPI.list();
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch (requestError) {
      setAccounts([]);
      setError(requestError.message || 'Unable to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    window.addEventListener(ACCOUNTS_CHANGED_EVENT, loadAccounts);
    return () => window.removeEventListener(ACCOUNTS_CHANGED_EVENT, loadAccounts);
  }, []);

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.platform, account])),
    [accounts],
  );

  if (isLoading) {
    return (
      <article className="dashboard-card" aria-live="polite">
        <p className="eyebrow">Linked accounts</p>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </article>
    );
  }

  return (
    <article className="dashboard-card linked-summary-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Linked accounts</p>
          <h2>{accounts.length} connected</h2>
        </div>
        <Link className="secondary-action" to="/accounts">
          Manage
        </Link>
      </div>

      {error ? (
        <div className="card-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadAccounts}>
            Retry
          </button>
        </div>
      ) : (
        <ul className="account-list">
          {PLATFORMS.map((platform) => {
            const account = accountMap.get(platform);

            return (
              <li key={platform}>
                <div>
                  <strong>{formatPlatform(platform)}</strong>
                  <span>{account?.handle || 'Not connected'}</span>
                </div>
                <span className={account ? 'status-pill connected' : 'status-pill'}>
                  {account ? 'Connected' : 'Connect'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
};

export default LinkedAccountsSummary;
