import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { platformAPI } from '../utils/api';

const PLATFORMS = [
  { value: 'CODEFORCES', label: 'Codeforces' },
  { value: 'LEETCODE', label: 'LeetCode' },
];

const ACCOUNTS_CHANGED_EVENT = 'platform-accounts:changed';

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function emitAccountsChanged() {
  window.dispatchEvent(new Event(ACCOUNTS_CHANGED_EVENT));
}

export const LinkedAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [platform, setPlatform] = useState('CODEFORCES');
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const connectedPlatforms = useMemo(
    () => new Set(accounts.map((account) => account.platform)),
    [accounts],
  );

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
    if (!success) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setSuccess(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [success]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedHandle = handle.trim();

    if (!trimmedHandle) {
      setError('Handle is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await platformAPI.create(platform, trimmedHandle);
      setHandle('');
      setSuccess('Account linked successfully.');
      emitAccountsChanged();
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.message || 'Unable to link account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (account) => {
    setDeletingId(account.id);
    setError('');
    setSuccess('');

    try {
      await platformAPI.delete(account.id);
      setSuccess(`${account.handle} was removed.`);
      emitAccountsChanged();
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete account');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <>
      <Header />
      <main className="page-shell accounts-shell">
        <section className="page-heading">
          <p className="eyebrow">Platform identity</p>
          <h1>Linked Accounts</h1>
          <p>Connect coding platform handles used for dashboard summaries.</p>
        </section>

        {(success || error) && (
          <section
            className={success ? 'notice-alert success' : 'notice-alert error'}
            role="status"
            aria-live="polite"
          >
            {success || error}
          </section>
        )}

        <section className="accounts-layout">
          <form className="account-form panel-section accent-panel" onSubmit={handleSubmit}>
            <p className="eyebrow">New connection</p>
            <h2>Add account</h2>

            <label htmlFor="platform">Platform</label>
            <select
              id="platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              disabled={isSubmitting}
            >
              {PLATFORMS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {connectedPlatforms.has(option.value) ? ' (connected)' : ''}
                </option>
              ))}
            </select>

            <label htmlFor="handle">Handle</label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="tourist"
              autoComplete="username"
              disabled={isSubmitting}
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Linking...' : 'Link account'}
            </button>
          </form>

          <section className="panel-section accounts-list-panel">
            <div className="card-heading">
              <div>
                <p className="eyebrow">Connected handles</p>
                <h2>{accounts.length} linked</h2>
              </div>
              <button type="button" onClick={loadAccounts} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {isLoading ? (
              <div className="account-list" aria-live="polite">
                <div className="skeleton skeleton-row" />
                <div className="skeleton skeleton-row" />
              </div>
            ) : accounts.length === 0 ? (
              <p className="empty-state">No platform accounts linked yet.</p>
            ) : (
              <ul className="account-list">
                {accounts.map((account) => (
                  <li key={account.id}>
                    <div>
                      <strong>{account.platform}</strong>
                      <span>
                        {account.handle} - linked {formatDate(account.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(account)}
                      disabled={Boolean(deletingId)}
                    >
                      {deletingId === account.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </main>
    </>
  );
};

export default LinkedAccounts;
