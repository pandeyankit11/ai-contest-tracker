import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import RatingChart from '../components/Analytics/RatingChart';
import DifficultyBreakdown from '../components/Analytics/DifficultyBreakdown';
import TopicBreakdown from '../components/Analytics/TopicBreakdown';
import ActivityHeatmap from '../components/Analytics/ActivityHeatmap';
import SolvedTrendsChart from '../components/Analytics/SolvedTrendsChart';

const Analytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    ratingHistory: null,
    difficultyBreakdown: null,
    topicBreakdown: null,
    activity: null,
    solvedTrends: null,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [ratingRes, difficultyRes, topicRes, activityRes, trendsRes] =
          await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/api/analytics/rating-history`, {
              headers,
            }),
            fetch(
              `${import.meta.env.VITE_API_URL}/api/analytics/difficulty-breakdown`,
              { headers }
            ),
            fetch(`${import.meta.env.VITE_API_URL}/api/analytics/topic-breakdown`, {
              headers,
            }),
            fetch(`${import.meta.env.VITE_API_URL}/api/analytics/activity`, { headers }),
            fetch(`${import.meta.env.VITE_API_URL}/api/analytics/solved-trends`, {
              headers,
            }),
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
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

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
        <div className="page-heading">
          <h1>Analytics</h1>
          <p>Track your progress across all platforms</p>
        </div>

        {error && (
          <div className="error-alert" role="alert">
            <strong>Error loading analytics:</strong> {error}
          </div>
        )}

        <div className="analytics-grid">
          <div className="analytics-card analytics-full-width">
            <RatingChart data={analyticsData.ratingHistory} />
          </div>

          <div className="analytics-card">
            <DifficultyBreakdown data={analyticsData.difficultyBreakdown} />
          </div>

          <div className="analytics-card">
            <TopicBreakdown data={analyticsData.topicBreakdown} />
          </div>

          <div className="analytics-card analytics-full-width">
            <ActivityHeatmap data={analyticsData.activity} />
          </div>

          <div className="analytics-card analytics-full-width">
            <SolvedTrendsChart data={analyticsData.solvedTrends} />
          </div>
        </div>
      </main>
    </>
  );
};

export default Analytics;
