const DifficultyBreakdown = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <>
        <div className="card-heading">
          <h2>Difficulty Breakdown</h2>
        </div>
        <div className="empty-state">
          <p>No problem data available</p>
        </div>
      </>
    );
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#10b981',
      medium: '#f59e0b',
      hard: '#ef4444',
    };
    return colors[difficulty] || '#9ca3af';
  };

  const getDifficultyLabel = (difficulty) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div>
      <div className="card-heading">
        <h2>Difficulty Breakdown</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {Object.entries(data).map(([platform, difficulties]) => {
          const total =
            (difficulties.easy || 0) +
            (difficulties.medium || 0) +
            (difficulties.hard || 0);

          return (
            <div key={platform} className="difficulty-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {['easy', 'medium', 'hard'].map((difficulty) => {
                  const count = difficulties[difficulty] || 0;
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={difficulty} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ minWidth: '50px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                          {getDifficultyLabel(difficulty)}
                        </span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: '20px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: getDifficultyColor(difficulty),
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <div style={{ minWidth: '40px', textAlign: 'right' }}>
                        <strong style={{ fontSize: '14px', color: getDifficultyColor(difficulty) }}>
                          {count}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '4px', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                  Total: <strong style={{ color: 'var(--text-h)' }}>{total}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultyBreakdown;
