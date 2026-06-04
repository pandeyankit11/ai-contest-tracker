import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // <-- Imported to get your token
import Header from '../components/Header';
import CodeforcesCard from '../components/Dashboard/CodeforcesCard';
import HeaderInfo from '../components/Dashboard/HeaderInfo';
import LinkedAccountsSummary from '../components/Dashboard/LinkedAccountsSummary';
import UpcomingContestsPreview from '../components/Dashboard/UpcomingContestsPreview';

export const Dashboard = () => {
  const { token } = useAuth(); // <-- Grab the auth token
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // Pass the token so the backend allows the request through!
        const response = await fetch('/api/auth/total-users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setActiveUsers(data.totalUsers);
        }
      } catch (error) {
        console.error("Failed to fetch user count", error);
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
        
        {/* Wrap HeaderInfo and the Badge in a Flex container to put it on the right */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px'
        }}>
          <HeaderInfo />

          {/* Sleek, simple badge aligned to the right */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '10px' // Aligns it nicely with your Welcome text
          }}>
            {/* Cool green glowing dot */}
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
            Active users : <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeUsers}</span>
          </div>
        </div>

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