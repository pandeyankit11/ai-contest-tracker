import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CodeforcesCard from '../components/Dashboard/CodeforcesCard';
import HeaderInfo from '../components/Dashboard/HeaderInfo';
import LinkedAccountsSummary from '../components/Dashboard/LinkedAccountsSummary';
import UpcomingContestsPreview from '../components/Dashboard/UpcomingContestsPreview';

export const Dashboard = () => {
  // --- NEW: State to hold the total number of registered users ---
  const [activeUsers, setActiveUsers] = useState(0);

  // --- NEW: Fetch the total user count when the dashboard loads ---
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch('/api/auth/total-users');
        const data = await response.json();
        
        if (data.success) {
          setActiveUsers(data.totalUsers);
        }
      } catch (error) {
        console.error("Failed to fetch user count", error);
      }
    };

    fetchUserCount();
  }, []);

  return (
    <>
      <Header />
      <main className="page-shell dashboard-shell">
        <HeaderInfo />

        {/* --- NEW: Active Users Banner --- */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60a5fa',
          padding: '10px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px', // Adds perfect spacing before the cards start
          fontWeight: '500',
          width: 'fit-content' // Keeps the box wrapped tightly around the text
        }}>
          <span style={{ fontSize: '1.2em' }}>🔥</span>
          Join {activeUsers} developers currently tracking their progress!
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