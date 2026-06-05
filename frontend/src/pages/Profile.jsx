import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  // Assuming your AuthContext provides an login/update utility or you can re-fetch
  const { user } = useAuth();

  // --- Local states for editing functionality ---
  const [isEditing, setIsEditing] = useState(false);
  
  // Clean fallback: Use their username, or extract a handle from their email if username is blank
  const defaultName = user?.username || user?.email?.split('@')[0] || "User";
  const [username, setUsername] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- State to hold dynamic platform statistics ---
  const [stats, setStats] = useState({
    cfRating: 0,
    cfMaxRating: 0,
    lcSolved: 0,
    lcRecentContests: 0,
    globalProblems: 0,
    globalContests: 0
  });

  // Sync state whenever the global user context updates or finishes fetching
  useEffect(() => {
    if (user) {
      const currentName = user.username || user.email?.split('@')[0] || "User";
      setUsername(currentName);

      // 1. Extract Codeforces Ratings (Sorted to get the LATEST rating)
      const cfSnapshots = user.ratingSnapshots
        ?.filter(s => s.platform === 'CODEFORCES')
        ?.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)); 
      
      const latestCfSnapshot = cfSnapshots?.[0]; 
      const cfRating = latestCfSnapshot?.rating || 0;
      const cfMaxRating = latestCfSnapshot?.maxRating || 0;

      // 2. Count Solved Problems (LeetCode from stats + Codeforces from array)
      const lcStats = user.platformStats?.find(s => s.platform === 'LEETCODE');
      const lcSolved = lcStats ? (lcStats.easy + lcStats.medium + lcStats.hard) : 0;
      
      const cfSolved = user.solvedProblems?.filter(p => p.platform === 'CODEFORCES').length || 0;
      const globalProblems = lcSolved + cfSolved;

      // 3. Count Contests (Filtering the contestParticipations array)
      const lcRecentContests = user.contestParticipations?.filter(c => c.platform === 'LEETCODE').length || 0;
      const globalContests = user.contestParticipations?.length || 0;

      // 4. Set the UI State
      setStats({
        cfRating,
        cfMaxRating,
        lcSolved,
        lcRecentContests, 
        globalProblems,
        globalContests    
      });
    }
  }, [user]);

  const email = user?.email || "No email available";
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Just now";

  const handleEditClick = async () => {
    if (isEditing) {
      // Don't issue a network request if the name hasn't changed
      const currentName = user?.username || user?.email?.split('@')[0] || "User";
      if (username.trim() === currentName) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);
      setErrorMsg('');

     try {
        const token = localStorage.getItem('token'); 
        
        // Ensure we hit the Render backend, not the Vercel frontend!
        // Fallback to localhost if you are testing on your own machine.
        const backendUrl = import.meta.env.VITE_API_URL || 'https://ai-contest-tracker-v2.onrender.com';
        
        const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ username: username.trim() })
        });

        // Safety check to read the raw text first in case it STILL isn't JSON
        const rawText = await response.text();
        let resData;
        
        try {
          resData = JSON.parse(rawText);
        } catch (parseError) {
          throw new Error("Server returned an invalid response. Check backend logs.");
        }

        if (!response.ok) {
          throw new Error(resData.message || "Failed to update profile name on the server.");
        }

        console.log("Database updated successfully:", resData.data.user.username);
        setIsEditing(false);
        
      } catch (err) {
        console.error("PROFILE_UPDATE_ERROR:", err.message);
        setErrorMsg(err.message || "Connection error. Reverting change locally.");
        const currentName = user?.username || user?.email?.split('@')[0] || "User";
        setUsername(currentName);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditing(true);
    }
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
              disabled={isSaving}
              autoFocus
            />
          ) : (
            <h1 className="profile-name">{username}</h1>
          )}
          <p className="profile-email">{email}</p>
          <span className="profile-joined">Joined: {joinedDate}</span>
          {errorMsg && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errorMsg}</p>}
        </div>
        <button 
          className="btn-edit-profile" 
          onClick={handleEditClick}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditing ? "Save Name" : "Edit Name"}
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