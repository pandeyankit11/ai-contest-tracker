import Header from '../components/Header';

const Calendar = () => {
  return (
    <>
      <Header />
      <main className="page-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(31, 41, 55, 0.3)', border: '1px solid #374151', borderRadius: '12px', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <h1 style={{ color: '#f3f4f6', marginBottom: '1rem', fontSize: '1.8rem' }}>Contest Calendar</h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: '1.6' }}>
            I am building a unified calendar to track upcoming coding contests across all platforms in one place. 
          </p>
          <div style={{ marginTop: '2rem' }}>
            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
              Coming Soon
            </span>
          </div>
        </div>
      </main>
    </>
  );
};

export default Calendar;