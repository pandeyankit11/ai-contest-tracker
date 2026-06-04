const { prisma } = require("../config/prisma");

// CACHE BUSTER
console.log("[SYSTEM] analytics.service.js initialized. Null-safe charts active.");

async function getRatingHistory(userId) {
  const snapshots = await prisma.ratingSnapshot.findMany({
    where: { userId },
    orderBy: [{ recordedAt: "asc" }],
    select: {
      platform: true,
      rating: true,
      maxRating: true,
      recordedAt: true,
    },
  });

  const groupedByPlatform = {};

  snapshots.forEach((snapshot) => {
    if (!snapshot || !snapshot.recordedAt) return; // Prevent date crashes

    if (!groupedByPlatform[snapshot.platform]) {
      groupedByPlatform[snapshot.platform] = { history: [], latestRating: null, maxRating: 0 };
    }
    
    try {
      groupedByPlatform[snapshot.platform].history.push({
        date: snapshot.recordedAt.toISOString().split("T")[0],
        rating: snapshot.rating || 0,
        maxRating: snapshot.maxRating || 0,
      });
    } catch (err) {
      console.warn(`[ANALYTICS] Invalid date on rating snapshot:`, err.message);
    }
  });

  Object.keys(groupedByPlatform).forEach((platform) => {
    const history = groupedByPlatform[platform].history;
    groupedByPlatform[platform].latestRating = history[history.length - 1]?.rating || null;
    groupedByPlatform[platform].maxRating = Math.max(...history.map((r) => r.maxRating || r.rating || 0), 0);
  });

  return groupedByPlatform;
}

async function getDifficultyBreakdown(userId) {
  const [problems, stats] = await Promise.all([
    prisma.solvedProblem.findMany({
      where: { userId },
      select: { platform: true, difficulty: true, rating: true },
    }),
    prisma.platformStats.findMany({
      where: { userId },
    }),
  ]);

  const result = {};

  stats.forEach((stat) => {
    if (!stat) return;
    result[stat.platform] = [
      { name: 'easy', count: stat.easy || 0 },
      { name: 'medium', count: stat.medium || 0 },
      { name: 'hard', count: stat.hard || 0 },
    ];
  });

  const tempGroups = {};

  problems.forEach((problem) => {
    if (!problem) return;
    if (problem.platform === "LEETCODE" && result["LEETCODE"]) return;

    if (!tempGroups[problem.platform]) {
      tempGroups[problem.platform] = {};
    }

    let diffKey = "unknown";
    
    // --- THE FIX 1: Explicitly handle unrated Codeforces problems ---
    if (problem.platform === "CODEFORCES") {
      diffKey = problem.rating ? problem.rating.toString() : "Unrated";
    } else if (problem.difficulty && typeof problem.difficulty === 'string') {
      diffKey = problem.difficulty.toLowerCase();
    }

    if (!tempGroups[problem.platform][diffKey]) {
      tempGroups[problem.platform][diffKey] = 0;
    }
    tempGroups[problem.platform][diffKey] += 1;
  });

  Object.entries(tempGroups).forEach(([platform, counts]) => {
    result[platform] = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Keep sorting numerical ratings, but push "Unrated" to the end
        if (a.name === "Unrated") return 1;
        if (b.name === "Unrated") return -1;
        if (!isNaN(a.name) && !isNaN(b.name)) return Number(a.name) - Number(b.name);
        return 0;
      });
  });

  return result;
}

async function getTopicBreakdown(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: { platform: true, tags: true },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!problem) return;
    if (!groupedByPlatform[problem.platform]) groupedByPlatform[problem.platform] = {};

    if (Array.isArray(problem.tags)) {
      problem.tags.forEach((tag) => {
        if (typeof tag === 'string') {
          groupedByPlatform[problem.platform][tag] = (groupedByPlatform[problem.platform][tag] || 0) + 1;
        }
      });
    }
  });

  const result = {};
  Object.entries(groupedByPlatform).forEach(([platform, tags]) => {
    result[platform] = Object.entries(tags)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  });

  return result;
}

async function getActivity(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: { platform: true, solvedAt: true },
    orderBy: { solvedAt: "asc" },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!problem || !problem.solvedAt) return; // Prevent date crash

    if (!groupedByPlatform[problem.platform]) groupedByPlatform[problem.platform] = {};

    try {
      const dateKey = problem.solvedAt.toISOString().split("T")[0];
      groupedByPlatform[problem.platform][dateKey] = (groupedByPlatform[problem.platform][dateKey] || 0) + 1;
    } catch (err) {
      console.warn(`[ANALYTICS] Invalid date on activity map:`, err.message);
    }
  });

  const result = {};
  Object.entries(groupedByPlatform).forEach(([platform, dates]) => {
    result[platform] = Object.entries(dates).map(([date, count]) => ({ date, count }));
  });

  return result;
}

async function getSolvedTrends(userId) {
  const [problems, stats] = await Promise.all([
    prisma.solvedProblem.findMany({
      where: { userId },
      select: { platform: true, solvedAt: true },
      orderBy: { solvedAt: "asc" },
    }),
    prisma.platformStats.findMany({
      where: { userId },
    }),
  ]);

  const groupedByPlatform = {};
  const cumulativeCounts = {};
  const platformOffsets = {};

  // --- THE FIX 2: Calculate missing dates into the baseline offset ---
  stats.forEach(stat => {
    if (!stat) return;
    
    // Count ALL problems in the DB, even the 3 without dates
    const totalInDB = problems.filter(p => p && p.platform === stat.platform).length;
    // Count ONLY the problems that can actually be drawn on the chart
    const totalWithDates = problems.filter(p => p && p.platform === stat.platform && p.solvedAt).length;
    
    // Use true total from stats if available, otherwise trust the DB total
    const totalAggregate = stat.totalSolved || ((stat.easy || 0) + (stat.medium || 0) + (stat.hard || 0)) || totalInDB;
    
    // The offset becomes the difference. (e.g. 97 total - 94 with dates = 3 baseline offset)
    if (totalAggregate > totalWithDates) {
      platformOffsets[stat.platform] = totalAggregate - totalWithDates;
    } else {
      platformOffsets[stat.platform] = 0;
    }
  });

  problems.forEach((problem) => {
    if (!problem || !problem.solvedAt) return; 

    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = new Map();
      // Initialize the count with our calculated offset (e.g. starts at 3 instead of 0)
      cumulativeCounts[problem.platform] = platformOffsets[problem.platform] || 0;
    }

    try {
      const dateKey = problem.solvedAt.toISOString().split("T")[0];
      cumulativeCounts[problem.platform] += 1; 
      groupedByPlatform[problem.platform].set(dateKey, cumulativeCounts[problem.platform]);
    } catch (err) {
      console.warn(`[ANALYTICS] Invalid date on trends map:`, err.message);
    }
  });

  const result = {};
  Object.entries(groupedByPlatform).forEach(([platform, dateMap]) => {
    result[platform] = Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  });

  return result;
}

module.exports = {
  getRatingHistory,
  getDifficultyBreakdown,
  getTopicBreakdown,
  getActivity,
  getSolvedTrends,
};