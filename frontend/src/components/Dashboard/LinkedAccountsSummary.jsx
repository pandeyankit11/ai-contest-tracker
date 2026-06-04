import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { platformAPI } from '../../utils/api';
// Re-use the shared wrapper + styles from CodeforcesCard
import { HoverBorderCard, HoverBorderStyles } from './CodeforcesCard';

const PLATFORMS = ['CODEFORCES', 'LEETCODE'];
const ACCOUNTS_CHANGED_EVENT = 'platform-accounts:changed';

const PLATFORM_META = {
  CODEFORCES: { label: 'Codeforces', accentColor: '#1a47c8' },
  LEETCODE:   { label: 'Leetcode',   accentColor: '#f5a623' },
};

function formatPlatform(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// ── Per-platform row ──────────────────────────────────────────────────────────
function PlatformRow({ platform, account }) {
  const [hovered, setHovered] = useState(false);
  const meta = PLATFORM_META[platform] ?? {
    label: formatPlatform(platform),
    accentColor: '#666',
  };

  return (
    <motion.li
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Animated left accent bar */}
      <motion.span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: '15%',
          bottom: '15%',
          width: 3,
          borderRadius: 4,
          background: meta.accentColor,
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={hovered ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />

      <div
        style={{
          paddingLeft: hovered ? '0.75rem' : '0.25rem',
          transition: 'padding 0.18s ease',
        }}
      >
        <strong
          style={{
            color: hovered ? meta.accentColor : undefined,
            transition: 'color 0.18s ease',
          }}
        >
          {meta.label}
        </strong>
        <span>{account?.handle || 'Not connected'}</span>
      </div>

      <span className={account ? 'status-pill connected' : 'status-pill'}>
        {account ? 'Connected' : 'Connect'}
      </span>
    </motion.li>
  );
}

// ── LinkedAccountsSummary ─────────────────────────────────────────────────────
export const LinkedAccountsSummary = () => {
  const [accounts,  setAccounts]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

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

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => {
    window.addEventListener(ACCOUNTS_CHANGED_EVENT, loadAccounts);
    return () => window.removeEventListener(ACCOUNTS_CHANGED_EVENT, loadAccounts);
  }, []);

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.platform, a])),
    [accounts],
  );

  if (isLoading) {
    return (
      <article className="dashboard-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }} aria-live="polite">
        <p className="eyebrow">Linked accounts</p>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </article>
    );
  }

  return (
    <>
      <HoverBorderStyles />

      {/* THE FIX: Added style={{ height: '100%', display: 'flex', flexDirection: 'column' }} */}
      <HoverBorderCard
        gradientFrom="#1a47c8"
        via="#f5a623"
        gradientTo="#c0392b"
        className="dashboard-card linked-summary-card"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div className="card-heading">
          <div>
            <p className="eyebrow">Linked accounts</p>
            <h2>{accounts.length} connected</h2>
          </div>
          <Link className="secondary-action" to="/accounts">Manage</Link>
        </div>

        {error ? (
          <div className="card-error" role="alert" style={{ marginTop: 'auto' }}>
            <p>{error}</p>
            <button type="button" onClick={loadAccounts}>Retry</button>
          </div>
        ) : (
          <ul className="account-list" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <AnimatePresence initial={false}>
              {PLATFORMS.map((platform, i) => (
                <motion.div
                  key={platform}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.28, ease: 'easeOut' }}
                >
                  <PlatformRow
                    platform={platform}
                    account={accountMap.get(platform)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </HoverBorderCard>

      <style>{`
        .account-list { list-style: none; padding: 0; margin: 0; }

        .account-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.5rem;
          border-radius: 8px;
          transition: background 0.18s ease;
          cursor: default;
        }

        .account-list li:hover {
          background: rgba(255,255,255,0.04);
        }

        .account-list li > div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .account-list li strong { font-size: 0.9rem; }

        .account-list li span:not(.status-pill) {
          font-size: 0.78rem;
          opacity: 0.55;
        }
      `}</style>
    </>
  );
};

export default LinkedAccountsSummary;