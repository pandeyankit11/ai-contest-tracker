import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { codeforcesAPI } from '../../utils/api';

// ─── Animated Number ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1.4 }) {
  const motionVal = useMotionValue(0);
  const rounded   = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const num = Number(value);
    if (value === null || value === undefined || isNaN(num)) {
      setDisplay(value ?? 'Unrated');
      return;
    }
    motionVal.set(0);
    const controls = animate(motionVal, num, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <>{display}</>;
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────
const RANK_COLORS = {
  newbie:                   '#808080',
  pupil:                    '#008000',
  specialist:               '#03a89e',
  expert:                   '#0000ff',
  'candidate master':       '#aa00aa',
  master:                   '#ff8c00',
  'international master':   '#ff8c00',
  grandmaster:              '#ff0000',
  'international grandmaster': '#ff0000',
  'legendary grandmaster':  '#aa0000',
};

function rankColor(rank = '') {
  return RANK_COLORS[rank.toLowerCase()] ?? '#808080';
}

// ─── Shared hover-border wrapper ──────────────────────────────────────────────
// Used by BOTH CodeforcesCard and LinkedAccountsSummary via same CSS class names
// so the animation is guaranteed identical.
//
// Strategy: renders two absolutely-positioned divs BEHIND the card —
//   • .hb-border  — the 2px gradient "frame" (opacity 0→1 on hover)
//   • .hb-glow    — the blurred halo behind it
// The inner card background is set explicitly so no global style can bleed through.
export function HoverBorderCard({ gradientFrom, gradientTo, via, className, children }) {
  const [hovered, setHovered] = useState(false);

  const midStop = via ? `, ${via} 50%` : '';
  const gradient = `linear-gradient(135deg, ${gradientFrom} 0%${midStop}, ${gradientTo} 100%)`;

  return (
    <motion.div
      className="hb-wrapper"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      {/* Border layer */}
      <motion.div
        className="hb-border"
        aria-hidden="true"
        style={{ background: gradient }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      {/* Glow layer */}
      <motion.div
        className="hb-glow"
        aria-hidden="true"
        style={{ background: gradient }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      {/* Content */}
      <div className={`hb-inner ${className ?? ''}`}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── CodeforcesCard ───────────────────────────────────────────────────────────
export const CodeforcesCard = () => {
  const [profile,   setProfile]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await codeforcesAPI.profile();
      setProfile(data);
    } catch (requestError) {
      setProfile(null);
      setError(requestError.message || 'Unable to load Codeforces profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  if (isLoading) {
    return (
      <article className="dashboard-card" aria-live="polite">
        <p className="eyebrow">Codeforces</p>
        <div className="skeleton skeleton-title" />
        <div className="stat-grid">
          <div className="skeleton skeleton-box" />
          <div className="skeleton skeleton-box" />
        </div>
      </article>
    );
  }

  return (
    <>
      <HoverBorderStyles />
      <HoverBorderCard
        gradientFrom="#1a47c8"
        gradientTo="#c0392b"
        className="dashboard-card codeforces-card"
      >
        <div className="card-heading">
          <div>
            <p className="eyebrow">Codeforces</p>
            <h2>{profile?.handle || 'No profile connected'}</h2>
          </div>
          {profile?.handle && (
            <a
              className="secondary-action"
              href={`https://codeforces.com/profile/${profile.handle}`}
              target="_blank"
              rel="noreferrer"
            >
              View profile
            </a>
          )}
        </div>

        {error ? (
          <div className="card-error" role="alert" style={{ marginTop: 'auto' }}>
            <p>{error}</p>
            <button type="button" onClick={loadProfile}>Retry</button>
          </div>
        ) : (
          <>
            <div className="stat-grid">
              <div>
                <span>Rating</span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedNumber value={profile?.rating ?? null} duration={1.4} />
                </strong>
              </div>
              <div>
                <span>Max rating</span>
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedNumber value={profile?.maxRating ?? null} duration={1.6} />
                </strong>
              </div>
            </div>

            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Rank:{' '}
              <span
                className="cf-rank-badge"
                style={{
                  color: rankColor(profile?.rank),
                  borderColor: rankColor(profile?.rank),
                }}
              >
                {profile?.rank || 'Unknown'}
              </span>
            </p>
          </>
        )}
      </HoverBorderCard>
    </>
  );
};

// ─── Shared styles injected once ─────────────────────────────────────────────
// Both cards import this — identical rules, one injection.
export function HoverBorderStyles() {
  return (
    <style>{`
      /* ── Hover-border wrapper system ──────────────────────────────────── */
      .hb-wrapper {
        position: relative;
        border-radius: 14px;
        height: 100%; 
        /* NO background here — the inner card provides its own */
      }

      /* The gradient "border" — sits behind the inner card via z-index */
      .hb-border {
        position: absolute;
        inset: 0;
        border-radius: 14px;
        z-index: 0;
        /* opacity controlled by framer-motion */
      }

      /* The soft outer glow */
      .hb-glow {
        position: absolute;
        inset: -5px;
        border-radius: 18px;
        filter: blur(14px);
        opacity: 0;
        z-index: 0;
        pointer-events: none;
      }

      /* Inner card — sits above border/glow layers */
      .hb-inner {
        position: relative;
        z-index: 1;
        border-radius: 12px;
        /* Pull it in by 2px on all sides to expose the gradient "border" */
        margin: 2px;
        /* Must set a solid background so gradient doesn't bleed through */
        background: var(--card-bg, #12141c);
        height: calc(100% - 4px); 
        display: flex;
        flex-direction: column;
      }

      /* ── Rank badge ─────────────────────────────────────────────────── */
      .cf-rank-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: capitalize;
        background: rgba(255,255,255,0.06);
        border: 1px solid currentColor;
      }
    `}</style>
  );
}

export default CodeforcesCard;