import { useState } from 'react';

const RatingChart = ({ data }) => {
  // State to track our custom floating tooltip
  const [tooltip, setTooltip] = useState({ show: false, data: null, x: 0, y: 0, color: '' });

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card-heading">
        <h2>Rating History</h2>
        <div className="empty-state">
          <p>No rating history data available</p>
        </div>
      </div>
    );
  }

  const getPlatformColor = (platform) => {
    const colors = {
      CODEFORCES: '#2563eb', // Blue
      LEETCODE: '#f59e0b',   // Orange
      CODECHEF: '#10b981',   // Green
    };
    return colors[platform.toUpperCase()] || '#9ca3af';
  };

  const maxRating = Math.max(
    ...Object.values(data)
      .map((p) => p.maxRating || 0)
      .filter((r) => r > 0)
  );

  const chartHeight = 240;
  const chartPadding = 40;
  const contentHeight = chartHeight - chartPadding * 2;
  const yAxisMax = Math.ceil(maxRating / 500) * 500;

  return (
    <div>
      <div className="card-heading">
        <h2>Rating History</h2>
      </div>

      <div className="rating-chart-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {Object.entries(data).map(([platform, platformData]) => (
            <div key={platform} className="platform-rating-card" style={{ position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <strong style={{ color: getPlatformColor(platform) }}>{platform}</strong>
                {platformData.latestRating !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Current</span>
                    <strong style={{ display: 'block', fontSize: '18px', color: 'var(--text-h)' }}>
                      {platformData.latestRating}
                    </strong>
                  </div>
                )}
              </div>

              <svg viewBox={`0 0 600 ${chartHeight}`} style={{ width: '100%', height: '240px', overflow: 'visible' }}>
                {/* Y-axis labels */}
                <text x="35" y="20" fontSize="12" fill="var(--text-soft)" textAnchor="end">
                  {yAxisMax}
                </text>
                <text x="35" y={chartHeight - 10} fontSize="12" fill="var(--text-soft)" textAnchor="end">
                  0
                </text>

                {/* Grid lines */}
                <line x1="40" y1={chartHeight - chartPadding} x2="590" y2={chartHeight - chartPadding} stroke="rgba(148, 163, 184, 0.2)" strokeDasharray="4,4" />

                {/* Data points and line */}
                {platformData.history.length > 0 && (
                  <>
                    {/* Plot line */}
                    {platformData.history.map((point, idx) => {
                      const xPos = 40 + (idx / (platformData.history.length - 1 || 1)) * (590 - 40);
                      const yPos = chartHeight - chartPadding - ((point.rating || 0) / yAxisMax) * contentHeight;

                      if (idx === 0) return null;

                      const prevPoint = platformData.history[idx - 1];
                      const prevXPos = 40 + ((idx - 1) / (platformData.history.length - 1 || 1)) * (590 - 40);
                      const prevYPos = chartHeight - chartPadding - ((prevPoint.rating || 0) / yAxisMax) * contentHeight;

                      return (
                        <line key={`line-${idx}`} x1={prevXPos} y1={prevYPos} x2={xPos} y2={yPos} stroke={getPlatformColor(platform)} strokeWidth="2" strokeOpacity="0.8" />
                      );
                    })}

                    {/* Interactive Data points */}
                    {platformData.history.map((point, idx) => {
                      const xPos = 40 + (idx / (platformData.history.length - 1 || 1)) * (590 - 40);
                      const yPos = chartHeight - chartPadding - ((point.rating || 0) / yAxisMax) * contentHeight;

                      return (
                        <circle
                          key={`point-${idx}`}
                          cx={xPos}
                          cy={yPos}
                          r="5" /* Slightly larger for easier hovering */
                          fill={getPlatformColor(platform)}
                          opacity="0.9"
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => {
                            e.target.setAttribute('r', '8'); // Enlarge dot on hover
                            setTooltip({
                              show: true,
                              data: point,
                              x: e.clientX,
                              y: e.clientY,
                              color: getPlatformColor(platform)
                            });
                          }}
                          onMouseLeave={(e) => {
                            e.target.setAttribute('r', '5'); // Shrink dot back
                            setTooltip({ show: false, data: null, x: 0, y: 0, color: '' });
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </svg>

              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px' }}>
                <span>Max Rating: <strong>{platformData.maxRating || 'N/A'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The Floating Tooltip Overlay */}
      {tooltip.show && tooltip.data && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y - 70, // Shift up above the cursor
            left: tooltip.x,
            transform: 'translateX(-50%)', // Center it horizontally over the dot
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: `1px solid ${tooltip.color}55`, // Subtle border matching the platform
            padding: '12px 16px',
            borderRadius: '8px',
            color: 'white',
            pointerEvents: 'none', // Prevents the tooltip from blocking mouse events
            zIndex: 9999,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            minWidth: '140px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '6px' }}>
             {tooltip.data.date ? new Date(tooltip.data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown Date'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '1.2rem', color: tooltip.color }}>
              {tooltip.data.rating}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingChart;