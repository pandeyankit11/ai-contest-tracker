const ActivityHeatmap = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <>
        <div className="card-heading">
          <h2>Activity Heatmap</h2>
        </div>
        <div className="empty-state">
          <p>No activity data available</p>
        </div>
      </>
    );
  }

  const getHeatmapColor = (count, maxCount) => {
    if (count === 0) return 'rgba(148, 163, 184, 0.1)';
    const intensity = (count / maxCount) * 0.8 + 0.2;
    return `rgba(37, 99, 235, ${intensity})`;
  };

  // Group dates by week and prepare heatmap
  const getAllDates = (data) => {
    const dates = new Set();
    Object.values(data).forEach((platform) => {
      Object.keys(platform).forEach((date) => dates.add(date));
    });
    return Array.from(dates).sort();
  };

  const allDates = getAllDates(data);

  if (allDates.length === 0) {
    return (
      <>
        <div className="card-heading">
          <h2>Activity Heatmap</h2>
        </div>
        <div className="empty-state">
          <p>No activity data available</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <div className="card-heading">
        <h2>Activity Heatmap</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {Object.entries(data).map(([platform, dates]) => {
          const maxCount = Math.max(...Object.values(dates), 1);

          // Get all dates for this platform
          const platformDates = allDates.filter((date) => dates[date] !== undefined);

          // Group dates by week
          const weeks = [];
          let currentWeek = [];

          platformDates.forEach((date) => {
            if (currentWeek.length === 7) {
              weeks.push([...currentWeek]);
              currentWeek = [];
            }
            currentWeek.push(date);
          });

          if (currentWeek.length > 0) {
            weeks.push(currentWeek);
          }

          return (
            <div key={platform} className="heatmap-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(weeks.length, 16)}, 1fr)`,
                  gap: '4px',
                }}
              >
                {weeks.map((week) =>
                  week.map((date) => (
                    <div
                      key={date}
                      style={{
                        aspectRatio: '1',
                        background: getHeatmapColor(dates[date], maxCount),
                        borderRadius: '3px',
                        border: '1px solid rgba(148, 163, 184, 0.16)',
                        cursor: 'pointer',
                        title: `${date}: ${dates[date]} problems`,
                      }}
                      title={`${date}: ${dates[date]} problems`}
                    />
                  ))
                )}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--text-soft)' }}>Activity:</span>
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      borderRadius: '2px',
                      border: '1px solid rgba(148, 163, 184, 0.16)',
                    }}
                  />
                  <span style={{ color: 'var(--text-soft)', fontSize: '11px' }}>Less</span>

                  {[0.3, 0.5, 0.7].map((opacity) => (
                    <div
                      key={opacity}
                      style={{
                        width: '14px',
                        height: '14px',
                        background: `rgba(37, 99, 235, ${opacity})`,
                        borderRadius: '2px',
                        border: '1px solid rgba(148, 163, 184, 0.16)',
                      }}
                    />
                  ))}

                  <span style={{ color: 'var(--text-soft)', fontSize: '11px' }}>More</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityHeatmap;
