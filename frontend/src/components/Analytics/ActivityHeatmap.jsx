import { useState, useMemo } from 'react';

const ActivityHeatmap = ({ data }) => {
  const [tooltip, setTooltip] = useState({ show: false, date: '', count: 0, x: 0, y: 0, color: '' });
  
  const availableYears = useMemo(() => {
    if (!data) return [new Date().getFullYear()];
    const years = new Set();
    Object.values(data).forEach(datesArray => {
      datesArray.forEach(d => {
        if (d.date) years.add(new Date(d.date).getFullYear());
      });
    });
    if (years.size === 0) return [new Date().getFullYear()];
    return Array.from(years).sort((a, b) => b - a);
  }, [data]);

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

  // Helper array for month names
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div>
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

          const firstDate = new Date(selectedYear, 0, 1); 
          firstDate.setDate(firstDate.getDate() - firstDate.getDay());

          const today = new Date();
          let lastDate = selectedYear === today.getFullYear() ? new Date() : new Date(selectedYear, 11, 31);
          lastDate.setDate(lastDate.getDate() + (6 - lastDate.getDay()));

          const timeline = [];
          let current = new Date(firstDate);
          while (current <= lastDate) {
            timeline.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }

          // --- NEW: Calculate exact X-axis positions for month labels ---
          const monthLabels = [];
          let lastMonth = -1;
          
          timeline.forEach((dateStr, index) => {
            // Split string to avoid timezone shifting issues
            const monthIndex = parseInt(dateStr.split('-')[1], 10) - 1;
            
            if (monthIndex !== lastMonth) {
              const colIndex = Math.floor(index / 7);
              monthLabels.push({
                label: MONTH_NAMES[monthIndex],
                colIndex: colIndex
              });
              lastMonth = monthIndex;
            }
          });

          return (
            <div key={platform} className="heatmap-card">
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text-h)' }}>{platform}</strong>
              </div>

              {/* Scrollable wrapper */}
              <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                
                {/* 1. The Heatmap Grid */}
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

                {/* --- NEW: 2. The Month Labels X-Axis --- */}
                <div 
                  style={{ 
                    position: 'relative', 
                    height: '20px', 
                    marginTop: '8px',
                    // Total width ensures the container scrolls alongside the grid perfectly
                    minWidth: `${Math.ceil(timeline.length / 7) * 18}px` 
                  }}
                >
                  {monthLabels.map((month, idx) => (
                    <span 
                      key={`month-${idx}`} 
                      style={{ 
                        position: 'absolute', 
                        // 14px box width + 4px gap = 18px per column
                        left: `${month.colIndex * 18}px`, 
                        fontSize: '11px', 
                        color: 'var(--text-soft, rgba(148, 163, 184, 0.8))'
                      }}
                    >
                      {month.label}
                    </span>
                  ))}
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