import { useState } from 'react';
import './TopicBreakdown.css';

const TopicBreakdown = ({ data }) => {
  // --- NEW: State to track which platform's topic list is expanded ---
  const [expanded, setExpanded] = useState({});

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

  // --- NEW: Toggle function for the "Show more / Show less" button ---
  const toggleExpand = (platform) => {
    setExpanded((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  return (
    <div>
      <div className="card-heading">
        <h2>Topic Analysis</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {Object.entries(data).map(([platform, topicsArray]) => {
          
          // Check if this specific platform is expanded
          const isExpanded = expanded[platform];
          
          // Slice the array if it's collapsed, show all if expanded
          const displayTopics = isExpanded ? topicsArray : topicsArray.slice(0, 8);
          
          // Calculate maxCount based on ALL topics so the bars don't jump when expanding
          const maxCount = Math.max(...topicsArray.map((t) => t.count), 1);

          return (
            <div key={platform} className="topics-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                {displayTopics.map(({ topic, count }) => {
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

              {/* --- NEW: Interactive Toggle Button --- */}
              {topicsArray.length > 8 && (
                <div
                  onClick={() => toggleExpand(platform)}
                  style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: 'var(--accent, #3b82f6)', // Bright blue so it looks clickable
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'inline-block',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#60a5fa'} // Lighter blue on hover
                  onMouseLeave={(e) => e.target.style.color = 'var(--accent, #3b82f6)'}
                >
                  {isExpanded ? 'Show less' : `+${topicsArray.length - 8} more topics`}
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