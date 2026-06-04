import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import CodeforcesCard from '../components/Dashboard/CodeforcesCard';
import HeaderInfo from '../components/Dashboard/HeaderInfo';
import LinkedAccountsSummary from '../components/Dashboard/LinkedAccountsSummary';
import UpcomingContestsPreview from '../components/Dashboard/UpcomingContestsPreview';

export const Dashboard = () => {
  const { token } = useAuth(); 
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('https://ai-contest-tracker-v2.onrender.com/api/auth/total-users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setActiveUsers(data.totalUsers);
        }
      } catch (error) {
        console.error("Failed to fetch user count:", error);
      }
    };

    if (token) {
      fetchUserCount();
    }
  }, [token]);

  return (
    <>
      <Header />

      {/* --- THE FIX: Increased top to 100px to push it down below the line --- */}
      <div style={{
        position: 'absolute',
        top: '150px',      // <-- Changed from 80px to 100px
        right: '120px',    
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2), inset 0 0 12px rgba(255, 255, 255, 0.05)',
        padding: '8px 20px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 100
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: '#10b981', 
          boxShadow: '0 0 8px #10b981, 0 0 16px #10b981' 
        }}></span>
        <span style={{
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontWeight: '600',
          letterSpacing: '0.5px'
        }}>
          ACTIVE USERS : <span style={{ color: '#fff', fontSize: '1.05rem', marginLeft: '4px' }}>{activeUsers}</span>
        </span>
      </div>

      <main className="page-shell dashboard-shell">
        <HeaderInfo />

        <section className="dashboard-grid" aria-label="Dashboard summary" style={{ marginTop: '32px' }}>
          <CodeforcesCard />
          <LinkedAccountsSummary />
          <UpcomingContestsPreview />
        </section>
      </main>
    </>
  );
};

export default Dashboard;