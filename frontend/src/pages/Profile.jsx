import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  // Grab the user directly from context. We don't even need the token here anymore!
  const { user } = useAuth();

  // --- Local states for editing functionality ---
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "Ankit");

  // --- State to hold dynamic platform statistics ---
  const [stats, setStats] = useState({
    cfRating: 0,
    cfMaxRating: 0,
    lcSolved: 0,
    lcRecentContests: 0,
    globalProblems: 0,
    globalContests: 0
  });

  // Whenever the user object loads or updates, extract the stats instantly
  useEffect(() => {
    if (user) {
      setUsername(user.username || "Ankit");

      // 1. Extract Codeforces Ratings from the Prisma ratingSnapshots array
      const cfSnapshot = user.ratingSnapshots?.find(s => s.platform === 'CODEFORCES');
      const cfRating = cfSnapshot?.rating || 0;
      const cfMaxRating = cfSnapshot?.maxRating || 0;

      // 2. Extract LeetCode Solved (Easy + Medium + Hard from platformStats)
      const lcStats = user.platformStats?.find(s => s.platform === 'LEETCODE');
      const lcSolved = lcStats ? (lcStats.easy + lcStats.medium + lcStats.hard) : 0;

      // 3. Calculate Global Problems (Sum of all platforms)
      const globalProblems = user.platformStats?.reduce((total, stat) => {
        return total + (stat.easy || 0) + (stat.medium || 0) + (stat.hard || 0);
      }, 0) || 0;

      // 4. Set the UI State
      setStats({
        cfRating,
        cfMaxRating,
        lcSolved,
        lcRecentContests: 0, // Set up later when contest participations are fetched
        globalProblems,
        globalContests: 0    // Set up later when contest participations are fetched
      });
    }
  }, [user]);

  const email = user?.email || "pandeyankit9a@gmail.com";
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Just now";

  const handleEditClick = () => {
    if (isEditing) {
      // TODO: Add an axios/fetch PUT request to persist name changes
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
              <span className="stat-value">{!user ? "..." : stats.cfRating}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Rating</span>
              <span className="stat-value">{!user ? "..." : stats.cfMaxRating}</span>
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
              <span className="stat-value">{!user ? "..." : stats.lcSolved}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Recent Contests</span>
              <span className="stat-value">{!user ? "..." : stats.lcRecentContests}</span>
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
              <span className="stat-value text-blue">{!user ? "..." : stats.globalProblems}</span> 
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Contests</span>
              <span className="stat-value text-blue">{!user ? "..." : stats.globalContests}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;