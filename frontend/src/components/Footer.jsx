const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '16px', 
          padding: '16px 20px',
          flexWrap: 'wrap'
        }}
      >
        <p className="footer-text" style={{ padding: 0, margin: 0 }}>
          © {currentYear} AI Contest Tracker by Ankit Pandey
        </p>
        
        {/* Divider dot - hides on very small screens if it wraps */}
        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '12px' }}>•</span>
        
        <p className="footer-text" style={{ padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Support & Contact:</span>
          <a 
            href="tel:+918208499312" 
            style={{ 
              color: '#60a5fa', 
              textDecoration: 'none',
              fontWeight: '600',
              letterSpacing: '0.5px'
            }}
          >
            +91 8208499312
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;