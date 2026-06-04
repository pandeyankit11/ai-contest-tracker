const SolvedTrendsChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <>
        <div className="card-heading">
          <h2>Solved Trends</h2>
        </div>
        <div className="empty-state">
          <p>No trend data available</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="card-heading">
        <h2>Solved Trends</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {Object.entries(data).map(([platform, trends]) => {
          if (!Array.isArray(trends) || trends.length === 0) {
            return (
              <div key={platform} className="empty-state">
                <p>No data for {platform}</p>
              </div>
            );
          }

          const maxCount = Math.max(...trends.map((t) => t.count || 0), 1);
          const chartHeight = 160;
          const chartWidth = 600;
          const padding = 40;
          const contentHeight = chartHeight - padding;
          const contentWidth = chartWidth - padding * 2;

          return (
            <div key={platform} className="trends-card" style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '200px', overflow: 'visible' }}>
                {/* Y-axis labels */}
                <text x="35" y="18" fontSize="12" fill="var(--text-soft)" textAnchor="end">
                  {maxCount}
                </text>
                <text
                  x="35"
                  y={chartHeight - padding + 5} 
                  fontSize="12"
                  fill="var(--text-soft)"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Grid lines (Bottom base line) */}
                <line
                  x1={padding}
                  y1={chartHeight - padding}
                  x2={chartWidth - padding}
                  y2={chartHeight - padding}
                  stroke="rgba(148, 163, 184, 0.2)"
                  strokeDasharray="4,4"
                />

                {/* Grid lines (Middle line) */}
                <line
                  x1={padding}
                  y1={padding + contentHeight / 2}
                  x2={chartWidth - padding}
                  y2={padding + contentHeight / 2}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeDasharray="4,4"
                />

                {/* --- NEW FIX: X-Axis Date Labels --- */}
                {trends.length > 0 && (() => {
                  const labelIndices = [];
                  
                  if (trends.length <= 4) {
                    trends.forEach((_, i) => labelIndices.push(i));
                  } else {
                    labelIndices.push(0); 
                    labelIndices.push(Math.floor(trends.length / 3)); 
                    labelIndices.push(Math.floor((2 * trends.length) / 3)); 
                    labelIndices.push(trends.length - 1); 
                  }

                  return labelIndices.map((idx) => {
                    const point = trends[idx];
                    const xPos = padding + (idx / (trends.length - 1 || 1)) * contentWidth;
                    
                    let textAnchor = "middle";
                    if (idx === 0) textAnchor = "start";
                    if (idx === trends.length - 1) textAnchor = "end";

                    const dateStr = point.date 
                      ? new Date(point.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                      : '';

                    return (
                      <text
                        key={`x-label-${idx}`}
                        x={xPos}
                        y={chartHeight - padding + 24} // Positioned perfectly below the grid line
                        fontSize="11"
                        fill="rgba(148, 163, 184, 0.6)"
                        textAnchor={textAnchor}
                      >
                        {dateStr}
                      </text>
                    );
                  });
                })()}

                {/* Area under curve */}
                {trends.length > 1 && (
                  <polygon
                    points={trends
                      .map((point, idx) => {
                        const xPos = padding + (idx / (trends.length - 1)) * contentWidth;
                        const yPos = chartHeight - padding - ((point.count || 0) / maxCount) * contentHeight;
                        return [xPos, yPos];
                      })
                      .concat([
                        [chartWidth - padding, chartHeight - padding],
                        [padding, chartHeight - padding],
                      ])
                      .map((p) => p.join(','))
                      .join(' ')}
                    fill="rgba(37, 99, 235, 0.15)"
                  />
                )}

                {/* Line chart */}
                {trends.length > 1 && (
                  <>
                    {trends.map((point, idx) => {
                      if (idx === 0) return null;

                      const prevPoint = trends[idx - 1];
                      const prevXPos = padding + ((idx - 1) / (trends.length - 1)) * contentWidth;
                      const prevYPos = chartHeight - padding - ((prevPoint.count || 0) / maxCount) * contentHeight;

                      const xPos = padding + (idx / (trends.length - 1)) * contentWidth;
                      const yPos = chartHeight - padding - ((point.count || 0) / maxCount) * contentHeight;

                      return (
                        <line
                          key={`line-${idx}`}
                          x1={prevXPos}
                          y1={prevYPos}
                          x2={xPos}
                          y2={yPos}
                          stroke="#2563eb"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      );
                    })}

                    {/* Data points */}
                    {trends.map((point, idx) => {
                      const xPos = padding + (idx / (trends.length - 1)) * contentWidth;
                      const yPos = chartHeight - padding - ((point.count || 0) / maxCount) * contentHeight;

                      return (
                        <circle
                          key={`point-${idx}`}
                          cx={xPos}
                          cy={yPos}
                          r="4"
                          fill="#2563eb"
                          opacity="0.9"
                        />
                      );
                    })}
                  </>
                )}
              </svg>

              <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '12px', justifyContent: 'space-between', color: 'var(--text-soft)' }}>
                <span>
                  Start: <strong style={{ color: 'var(--text-h)' }}>{trends[0]?.date}</strong>
                </span>
                <span>
                  End: <strong style={{ color: 'var(--text-h)' }}>{trends[trends.length - 1]?.date}</strong>
                </span>
                <span>
                  Total: <strong style={{ color: 'var(--text-h)', color: '#3b82f6' }}>{trends[trends.length - 1]?.count || 0}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SolvedTrendsChart;