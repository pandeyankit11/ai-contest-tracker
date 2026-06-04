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
    if (!snapshot || !snapshot.recordedAt) return; 

    if (!groupedByPlatform[snapshot.platform]) {
      groupedByPlatform[snapshot.platform] = { history: [], latestRating: null, maxRating: 0 };
    }
    
    try {
      groupedByPlatform[snapshot.platform].history.push({
        date: snapshot.recordedAt.toISOString().split("T")[0],
        rating: snapshot.rating || 0,
        maxRating: snapshot.maxRating || 0,
      });
    } catch (err) {}
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
    select: { platform: true, tags: true, externalId: true }, 
  });

  const groupedByPlatform = {
    CODEFORCES: {},
    LEETCODE: {} 
  };

  const hasLCAggregator = problems.some(p => p.externalId === 'lc-topics-aggregator');

  problems.forEach((problem) => {
    if (!problem) return;
    
    if (problem.platform === 'LEETCODE') {
      if (hasLCAggregator && problem.externalId !== 'lc-topics-aggregator') return;
    }

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
    select: { platform: true, solvedAt: true, externalId: true }, 
    orderBy: { solvedAt: "asc" },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!problem || !problem.solvedAt) return; 
    
    // Explicitly exclude the aggregator, but KEEP the historical blocks 
    // so the heatmap accurately reflects total submission intensity!
    if (problem.externalId === 'lc-topics-aggregator') return;

    if (!groupedByPlatform[problem.platform]) groupedByPlatform[problem.platform] = {};

    try {
      const dateKey = problem.solvedAt.toISOString().split("T")[0];
      groupedByPlatform[problem.platform][dateKey] = (groupedByPlatform[problem.platform][dateKey] || 0) + 1;
    } catch (err) {}
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
      select: { platform: true, solvedAt: true, externalId: true }, 
      orderBy: { solvedAt: "asc" },
    }),
    prisma.platformStats.findMany({
      where: { userId },
    }),
  ]);

  const groupedByPlatform = {};
  const cumulativeCounts = {};
  const platformOffsets = {};

  // --- THE FIX: Exclude the Aggregator AND Historical Submission Blocks ---
  // This ensures the math relies strictly on your true total (144) 
  // and only draws the validated unique problems on top of it.
  const validProblems = problems.filter(p => {
    if (!p) return false;
    if (p.externalId === 'lc-topics-aggregator') return false;
    if (p.externalId && p.externalId.startsWith('lc-historical-')) return false;
    return true;
  });

  stats.forEach(stat => {
    if (!stat) return;
    
    const totalInDB = validProblems.filter(p => p.platform === stat.platform).length;
    const totalWithDates = validProblems.filter(p => p.platform === stat.platform && p.solvedAt).length;
    
    // We trust the true total from stats (e.g., 144) over the DB rows
    const totalAggregate = stat.totalSolved || ((stat.easy || 0) + (stat.medium || 0) + (stat.hard || 0)) || totalInDB;
    
    if (totalAggregate > totalWithDates) {
      platformOffsets[stat.platform] = totalAggregate - totalWithDates;
    } else {
      platformOffsets[stat.platform] = 0;
    }
  });

  validProblems.forEach((problem) => {
    if (!problem.solvedAt) return; 

    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = new Map();
      cumulativeCounts[problem.platform] = platformOffsets[problem.platform] || 0;
    }

    try {
      const dateKey = problem.solvedAt.toISOString().split("T")[0];
      cumulativeCounts[problem.platform] += 1; 
      groupedByPlatform[problem.platform].set(dateKey, cumulativeCounts[problem.platform]);
    } catch (err) {}
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