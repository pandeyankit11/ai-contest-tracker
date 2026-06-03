import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  // Grab the token alongside the user for authenticated API requests
  const { user, token } = useAuth();

  // --- Local states for editing functionality ---
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "Ankit");

  // --- NEW: State to hold dynamic platform statistics ---
  const [stats, setStats] = useState({
    cfRating: 0,
    cfMaxRating: 0,
    lcSolved: 0,
    lcRecentContests: 0,
    globalProblems: 0,
    globalContests: 0
  });
  
  // Optional loading state if you want to add skeleton loaders later
  const [loading, setLoading] = useState(true);

  // Keep the input text in sync if the user object loads late
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  // --- NEW: Fetch dynamic stats from the backend ---
  // --- NEW: Fetch and calculate stats from known working endpoints ---
  // --- NEW: Fetch and calculate stats using the exact backend schema ---
  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [ratingRes, difficultyRes] = await Promise.all([
          fetch('/api/analytics/rating-history', { headers }),
          fetch('/api/analytics/difficulty-breakdown', { headers })
        ]);

        if (!ratingRes.ok || !difficultyRes.ok) throw new Error("Failed to fetch");

        const ratingJson = await ratingRes.json();
        const difficultyJson = await difficultyRes.json();

        const ratingData = ratingJson.data || {};
        const difficultyData = difficultyJson.data || {};

        let cfRating = 0, cfMaxRating = 0, cfContests = 0;
        let lcSolved = 0, totalProbs = 0;

        // 1. Map Codeforces Ratings (Using your exact backend keys)
        if (ratingData.CODEFORCES) {
          cfRating = ratingData.CODEFORCES.latestRating || 0;
          cfMaxRating = ratingData.CODEFORCES.maxRating || 0;
          // Count the history array for total contests
          cfContests = ratingData.CODEFORCES.history ? ratingData.CODEFORCES.history.length : 0;
        }

        // 2. Map LeetCode & Global Problems
        Object.keys(difficultyData).forEach(platform => {
          const platformItems = difficultyData[platform];
          let platformTotal = 0;
          
          // Since it's an array of objects [{ difficulty: 'Easy', count: X }, ...]
          if (Array.isArray(platformItems)) {
            platformTotal = platformItems.reduce((sum, item) => {
              // Extract the numeric count (checking common key names)
              return sum + (Number(item.count || item.value || item.solved || item.total) || 0);
            }, 0);
          }
          
          totalProbs += platformTotal;
          
          if (platform === 'LEETCODE') {
            lcSolved = platformTotal;
          }
        });

        // 3. Update the UI State
        setStats({
          cfRating: cfRating,
          cfMaxRating: cfMaxRating,
          lcSolved: lcSolved,
          lcRecentContests: 0, 
          globalProblems: totalProbs,
          globalContests: cfContests 
        });

      } catch (error) {
        console.error("Failed to load profile statistics", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfileStats();
  }, [token]);
  
  const email = user?.email || "pandeyankit9a@gmail.com";
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Just now";

  const handleEditClick = () => {
    if (isEditing) {
      // TODO: In the deployment phase, add an axios/fetch PUT request 
      // here to persist the username change in your database!
      console.log("Saved name locally:", username);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          {isEditing ? (
            <input 
              type="text" 
              className="profile-name-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          ) : (
            <h1 className="profile-name">{username}</h1>
          )}
          <p className="profile-email">{email}</p>
          <span className="profile-joined">Joined: {joinedDate}</span>
        </div>
        <button className="btn-edit-profile" onClick={handleEditClick}>
          {isEditing ? "Save Name" : "Edit Name"}
        </button>
      </div>

      <h2 className="section-title">Current Standings</h2>
      <div className="stats-grid">
        
        {/* Codeforces Card */}
        <div className="stat-card codeforces-card">
          <div className="stat-header">
            <h3>Codeforces</h3>
            <span className="platform-badge cf-badge">Active</span>
          </div>
          <div className="stat-body">
            <div className="stat-item">
              <span className="stat-label">Rating</span>
              <span className="stat-value">{loading ? "..." : stats.cfRating}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Rating</span>
              <span className="stat-value">{loading ? "..." : stats.cfMaxRating}</span>
            </div>
          </div>
        </div>

        {/* LeetCode Card */}
        <div className="stat-card leetcode-card">
          <div className="stat-header">
            <h3>LeetCode</h3>
            <span className="platform-badge lc-badge">Active</span>
          </div>
          <div className="stat-body">
            <div className="stat-item">
              <span className="stat-label">Total Solved</span>
              <span className="stat-value">{loading ? "..." : stats.lcSolved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Recent Contests</span>
              <span className="stat-value">{loading ? "..." : stats.lcRecentContests}</span>
            </div>
          </div>
        </div>

        {/* Global Stats Card */}
        <div className="stat-card global-card">
          <div className="stat-header">
            <h3>Global Activity</h3>
          </div>
          <div className="stat-body">
            <div className="stat-item">
              <span className="stat-label">Total Problems</span>
              <span className="stat-value text-blue">{loading ? "..." : stats.globalProblems}</span> 
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Contests</span>
              <span className="stat-value text-blue">{loading ? "..." : stats.globalContests}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;