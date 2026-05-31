import { useEffect, useState } from 'react';
import { codeforcesAPI } from '../../utils/api';

function formatRating(value) {
  return value === null || value === undefined ? 'Unrated' : value;
}

export const CodeforcesCard = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadProfile();
  }, []);

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
    <article className="dashboard-card">
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
        <div className="card-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadProfile}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div>
              <span>Rating</span>
              <strong>{formatRating(profile?.rating)}</strong>
            </div>
            <div>
              <span>Max rating</span>
              <strong>{formatRating(profile?.maxRating)}</strong>
            </div>
          </div>
          <p className="muted">
            Rank: <strong>{profile?.rank || 'Unknown'}</strong>
          </p>
        </>
      )}
    </article>
  );
};

export default CodeforcesCard;
