import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import RatingChart from '../components/Analytics/RatingChart';
import DifficultyBreakdown from '../components/Analytics/DifficultyBreakdown';
import TopicBreakdown from '../components/Analytics/TopicBreakdown';
import ActivityHeatmap from '../components/Analytics/ActivityHeatmap';
import SolvedTrendsChart from '../components/Analytics/SolvedTrendsChart';
import { motion } from 'framer-motion';

const Analytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    ratingHistory: null,
    difficultyBreakdown: null,
    topicBreakdown: null,
    activity: null,
    solvedTrends: null,
  });

  // Extract fetch logic so it can be called on mount and after syncing
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [ratingRes, difficultyRes, topicRes, activityRes, trendsRes] =
        await Promise.all([
          fetch('/api/analytics/rating-history', { headers }),
          fetch('/api/analytics/difficulty-breakdown', { headers }),
          fetch('/api/analytics/topic-breakdown', { headers }),
          fetch('/api/analytics/activity', { headers }),
          fetch('/api/analytics/solved-trends', { headers }),
        ]);

      if (
        !ratingRes.ok ||
        !difficultyRes.ok ||
        !topicRes.ok ||
        !activityRes.ok ||
        !trendsRes.ok
      ) {
        throw new Error('Failed to fetch analytics data');
      }

      const [ratingData, difficultyData, topicData, activityData, trendsData] =
        await Promise.all([
          ratingRes.json(),
          difficultyRes.json(),
          topicRes.json(),
          activityRes.json(),
          trendsRes.json(),
        ]);

      setAnalyticsData({
        ratingHistory: ratingData.data,
        difficultyBreakdown: difficultyData.data,
        topicBreakdown: topicData.data,
        activity: activityData.data,
        solvedTrends: trendsData.data,
      });
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, fetchAnalytics]);

  // Handle manual data synchronization
  const handleSync = async () => {
    console.log('DEBUG: handleSync fired, token present:', !!token);
    
    if (!token) {
      setError('Not authenticated.');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      console.log('DEBUG: Attempting POST /api/analytics/sync');
      
      // Use the native global fetch explicitly
      const response = await fetch('/api/analytics/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('DEBUG: Response received:', response);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      await fetchAnalytics();
      console.log('DEBUG: Sync and re-fetch complete');
      
    } catch (err) {
      // THIS IS THE MOST IMPORTANT PART
      console.error('CRITICAL ERROR CAUGHT:', err);
      // If the error is a TypeError, it's usually a proxy/connection issue
      setError(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="page-shell analytics-shell">
          <div className="page-heading">
            <h1>Analytics</h1>
          </div>
          <div className="analytics-grid">
            <div className="skeleton skeleton-title" style={{ height: '200px' }} />
            <div className="skeleton skeleton-title" style={{ height: '200px' }} />
            <div className="skeleton skeleton-title" style={{ height: '200px' }} />
            <div className="skeleton skeleton-title" style={{ height: '200px' }} />
            <div className="skeleton skeleton-title" style={{ height: '200px' }} />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="page-shell analytics-shell">
        <div className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Analytics</h1>
            <p>Track your progress across all platforms</p>
          </div>
          
          {/* THE NEW ANIMATED SYNC BUTTON */}
          <button 
            onClick={handleSync} 
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              minWidth: '130px', /* Prevents button jitter when text changes */
              height: '40px',
              padding: '0 20px',
              opacity: syncing ? 0.7 : 1,
              backgroundColor: syncing ? 'rgba(59, 130, 246, 0.4)' : 'var(--accent)',
              cursor: syncing ? 'wait' : 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {syncing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{
                    width: '16px', 
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%'
                  }}
                />
                Syncing...
              </>
            ) : (
              "Sync Data"
            )}
          </button>
        </div>

        {error && (
          <div className="error-alert" role="alert" style={{ marginBottom: '20px', color: '#ef4444' }}>
            <strong>Notice:</strong> {error}
          </div>
        )}

        <div className="analytics-grid">
          <div className="analytics-card analytics-full-width">
            <RatingChart data={analyticsData.ratingHistory || {}} />
          </div>

          <div className="analytics-card">
            <DifficultyBreakdown data={analyticsData.difficultyBreakdown || {}} />
          </div>

          <div className="analytics-card">
            <TopicBreakdown data={analyticsData.topicBreakdown || {}} />
          </div>

          <div className="analytics-card analytics-full-width">
            <ActivityHeatmap data={analyticsData.activity || {}} />
          </div>

          <div className="analytics-card analytics-full-width">
            <SolvedTrendsChart data={analyticsData.solvedTrends || {}} />
          </div>
        </div>
      </main>
    </>
  );
};

export default Analytics;