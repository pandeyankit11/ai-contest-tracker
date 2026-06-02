const RatingChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="card-heading">
        <h2>Rating History</h2>
      </div>
    ) || (
      <div className="empty-state">
        <p>No rating history data available</p>
      </div>
    );
  }

  const getPlatformColor = (platform) => {
    const colors = {
      CODEFORCES: '#2563eb',
      LEETCODE: '#f59e0b',
      CODECHEF: '#10b981',
    };
    return colors[platform] || '#9ca3af';
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
            <div key={platform} className="platform-rating-card">
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

              <svg viewBox={`0 0 600 ${chartHeight}`} style={{ width: '100%', height: '240px' }}>
                {/* Y-axis labels */}
                <text x="35" y="20" fontSize="12" fill="var(--text-soft)" textAnchor="end">
                  {yAxisMax}
                </text>
                <text
                  x="35"
                  y={chartHeight - 10}
                  fontSize="12"
                  fill="var(--text-soft)"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Grid lines */}
                <line
                  x1="40"
                  y1={chartHeight - chartPadding}
                  x2="590"
                  y2={chartHeight - chartPadding}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeDasharray="4,4"
                />

                {/* Data points and line */}
                {platformData.history.length > 0 && (
                  <>
                    {/* Plot line */}
                    {platformData.history.map((point, idx) => {
                      const xPos =
                        40 +
                        (idx / (platformData.history.length - 1 || 1)) *
                          (590 - 40);
                      const yPos =
                        chartHeight -
                        chartPadding -
                        ((point.rating || 0) / yAxisMax) * contentHeight;

                      if (idx === 0) return null;

                      const prevPoint = platformData.history[idx - 1];
                      const prevXPos =
                        40 +
                        ((idx - 1) / (platformData.history.length - 1 || 1)) *
                          (590 - 40);
                      const prevYPos =
                        chartHeight -
                        chartPadding -
                        ((prevPoint.rating || 0) / yAxisMax) * contentHeight;

                      return (
                        <line
                          key={`line-${idx}`}
                          x1={prevXPos}
                          y1={prevYPos}
                          x2={xPos}
                          y2={yPos}
                          stroke={getPlatformColor(platform)}
                          strokeWidth="2"
                          strokeOpacity="0.8"
                        />
                      );
                    })}

                    {/* Data points */}
                    {platformData.history.map((point, idx) => {
                      const xPos =
                        40 +
                        (idx / (platformData.history.length - 1 || 1)) *
                          (590 - 40);
                      const yPos =
                        chartHeight -
                        chartPadding -
                        ((point.rating || 0) / yAxisMax) * contentHeight;

                      return (
                        <circle
                          key={`point-${idx}`}
                          cx={xPos}
                          cy={yPos}
                          r="4"
                          fill={getPlatformColor(platform)}
                          opacity="0.9"
                        />
                      );
                    })}
                  </>
                )}
              </svg>

              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px' }}>
                <span>
                  Max Rating: <strong>{platformData.maxRating || 'N/A'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingChart;
