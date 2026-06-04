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
      <main className="page-shell dashboard-shell">
        
        {/* --- THE FIX: Dedicated row for the badge, pushed to the far right --- */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            Active users : <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeUsers}</span>
          </div>
        </div>

        {/* --- HeaderInfo is freed from Flexbox and restored to full width! --- */}
        <HeaderInfo />

        <section className="dashboard-grid" aria-label="Dashboard summary">
          <CodeforcesCard />
          <LinkedAccountsSummary />
          <UpcomingContestsPreview />
        </section>
      </main>
    </>
  );
};

export default Dashboard;