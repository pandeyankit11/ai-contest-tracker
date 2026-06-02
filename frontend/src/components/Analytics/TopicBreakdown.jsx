const TopicBreakdown = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <>
        <div className="card-heading">
          <h2>Topic Analysis</h2>
        </div>
        <div className="empty-state">
          <p>No topic data available</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="card-heading">
        <h2>Topic Analysis</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {Object.entries(data).map(([platform, topics]) => {
          // Sort topics by count and get top 8
          const sortedTopics = Object.entries(topics)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 8);

          const maxCount = Math.max(...sortedTopics.map(([, count]) => count), 1);

          return (
            <div key={platform} className="topics-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {sortedTopics.map(([topic, count]) => {
                  const percentage = (count / maxCount) * 100;

                  return (
                    <div key={topic} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            fontSize: '13px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              maxWidth: '140px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'var(--text-h)',
                            }}
                            title={topic}
                          >
                            {topic}
                          </span>
                          <span style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                            {count}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '60px',
                          height: '18px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, var(--accent), var(--accent-soft))`,
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(topics).length > 8 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-soft)' }}>
                  +{Object.keys(topics).length - 8} more topics
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicBreakdown;
