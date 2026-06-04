import { useState, useMemo } from 'react';

const ActivityHeatmap = ({ data }) => {
  const [tooltip, setTooltip] = useState({ show: false, date: '', count: 0, x: 0, y: 0, color: '' });
  
  // --- NEW: Calculate available years based on the user's data ---
  const availableYears = useMemo(() => {
    if (!data) return [new Date().getFullYear()];
    const years = new Set();
    Object.values(data).forEach(datesArray => {
      datesArray.forEach(d => {
        if (d.date) years.add(new Date(d.date).getFullYear());
      });
    });
    // If empty, fallback to this year
    if (years.size === 0) return [new Date().getFullYear()];
    return Array.from(years).sort((a, b) => b - a); // Sort newest to oldest
  }, [data]);

  // --- NEW: State to track the currently selected year ---
  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

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

  return (
    <div>
      {/* --- NEW: Header now includes the Year Dropdown --- */}
      <div className="card-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Activity Heatmap</h2>
        
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#e2e8f0',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {Object.entries(data).map(([platform, datesArray]) => {
          if (!datesArray || datesArray.length === 0) return null;

          const maxCount = Math.max(...datesArray.map((d) => d.count), 1);
          const dateMap = new Map(datesArray.map((d) => [d.date, d.count]));

          // --- NEW: Timeline strictly bound to the selected year ---
          // Find the nearest Sunday before Jan 1st of the selected year
          const firstDate = new Date(selectedYear, 0, 1); 
          firstDate.setDate(firstDate.getDate() - firstDate.getDay());

          // Find the nearest Saturday after Dec 31st of the selected year
          // If the selected year is the CURRENT year, stop at today so it doesn't draw empty future boxes
          const today = new Date();
          let lastDate = selectedYear === today.getFullYear() ? new Date() : new Date(selectedYear, 11, 31);
          lastDate.setDate(lastDate.getDate() + (6 - lastDate.getDay()));

          const timeline = [];
          let current = new Date(firstDate);
          while (current <= lastDate) {
            timeline.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }

          return (
            <div key={platform} className="heatmap-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: 'repeat(7, 14px)', 
                    gridAutoColumns: '14px',             
                    gridAutoFlow: 'column',              
                    gap: '4px',
                    minWidth: 'max-content',
                  }}
                >
                  {timeline.map((date) => {
                    const count = dateMap.get(date) || 0;
                    const squareColor = getHeatmapColor(count, maxCount);
                    
                    return (
                      <div
                        key={date}
                        style={{
                          width: '14px',
                          height: '14px',
                          background: squareColor,
                          borderRadius: '3px',
                          border: '1px solid rgba(148, 163, 184, 0.16)',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease, border-color 0.1s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.2)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                          setTooltip({
                            show: true,
                            date: date,
                            count: count,
                            x: e.clientX,
                            y: e.clientY,
                            color: count > 0 ? squareColor : '#4b5563'
                          });
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.borderColor = 'rgba(148, 163, 184, 0.16)';
                          setTooltip({ show: false, date: '', count: 0, x: 0, y: 0, color: '' });
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-soft)' }}>Activity:</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '14px', height: '14px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '2px', border: '1px solid rgba(148, 163, 184, 0.16)' }} />
                  <span style={{ color: 'var(--text-soft)', fontSize: '11px' }}>Less</span>
                  {[0.3, 0.5, 0.7].map((opacity) => (
                    <div key={opacity} style={{ width: '14px', height: '14px', background: `rgba(37, 99, 235, ${opacity})`, borderRadius: '2px', border: '1px solid rgba(148, 163, 184, 0.16)' }} />
                  ))}
                  <span style={{ color: 'var(--text-soft)', fontSize: '11px' }}>More</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y - 65, 
            left: tooltip.x,
            transform: 'translateX(-50%)', 
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            border: `1px solid ${tooltip.color}`, 
            padding: '10px 14px',
            borderRadius: '8px',
            color: 'white',
            pointerEvents: 'none', 
            zIndex: 9999,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
            minWidth: '120px',
            backdropFilter: 'blur(4px)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>
             {new Date(tooltip.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontWeight: '700', fontSize: '1rem', color: tooltip.count > 0 ? '#60a5fa' : '#9ca3af' }}>
            {tooltip.count} {tooltip.count === 1 ? 'problem' : 'problems'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;