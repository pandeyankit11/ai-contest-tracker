const { prisma } = require("../config/prisma");

async function getRatingHistory(userId) {
  const snapshots = await prisma.ratingSnapshot.findMany({
    where: { userId },
    orderBy: [{ recordedAt: "asc" }], // Charts flow left-to-right, so sort oldest to newest
    select: {
      platform: true,
      rating: true,
      maxRating: true,
      recordedAt: true,
    },
  });

  const groupedByPlatform = {};

  snapshots.forEach((snapshot) => {
    if (!groupedByPlatform[snapshot.platform]) {
      groupedByPlatform[snapshot.platform] = { history: [], latestRating: null, maxRating: 0 };
    }
    
    groupedByPlatform[snapshot.platform].history.push({
      date: snapshot.recordedAt.toISOString().split("T")[0],
      rating: snapshot.rating,
      maxRating: snapshot.maxRating,
    });
  });

  // Calculate the latest and max ratings
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

  // 1. Process LeetCode Stats (Lifetime Aggregates)
  // We use the new PlatformStats table which contains your correct 142 count
  stats.forEach((stat) => {
    result[stat.platform] = [
      { name: 'easy', count: stat.easy },
      { name: 'medium', count: stat.medium },
      { name: 'hard', count: stat.hard },
    ];
  });

  // 2. Process other platforms (e.g., Codeforces) from SolvedProblem
  // We use a temporary object to group these ratings before converting to array
  const tempGroups = {};

  problems.forEach((problem) => {
    // Skip LeetCode if we already have aggregate stats for it
    if (problem.platform === "LEETCODE" && result["LEETCODE"]) return;

    if (!tempGroups[problem.platform]) {
      tempGroups[problem.platform] = {};
    }

    let diffKey = "unknown";
    if (problem.platform === "CODEFORCES" && problem.rating) {
      diffKey = problem.rating.toString();
    } else if (problem.difficulty) {
      diffKey = problem.difficulty.toLowerCase();
    }

    if (!tempGroups[problem.platform][diffKey]) {
      tempGroups[problem.platform][diffKey] = 0;
    }
    tempGroups[problem.platform][diffKey] += 1;
  });

  // 3. Convert tempGroups to chart-friendly arrays and add to result
  Object.entries(tempGroups).forEach(([platform, counts]) => {
    result[platform] = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
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
    if (!groupedByPlatform[problem.platform]) groupedByPlatform[problem.platform] = {};

    if (Array.isArray(problem.tags)) {
      problem.tags.forEach((tag) => {
        groupedByPlatform[problem.platform][tag] = (groupedByPlatform[problem.platform][tag] || 0) + 1;
      });
    }
  });

  // Convert to sorted arrays and take Top 15 topics so charts don't overflow
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
    if (!groupedByPlatform[problem.platform]) groupedByPlatform[problem.platform] = {};

    const dateKey = problem.solvedAt.toISOString().split("T")[0];
    groupedByPlatform[problem.platform][dateKey] = (groupedByPlatform[problem.platform][dateKey] || 0) + 1;
  });

  // Convert to array format for heatmaps [{ date: '2023-01-01', count: 5 }]
  const result = {};
  Object.entries(groupedByPlatform).forEach(([platform, dates]) => {
    result[platform] = Object.entries(dates).map(([date, count]) => ({ date, count }));
  });

  return result;
}

async function getSolvedTrends(userId) {
  // Fetch both individual problems and the total stats concurrently
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

  // 1. Calculate the starting offset for platforms like LeetCode
  stats.forEach(stat => {
    const totalAggregate = stat.easy + stat.medium + stat.hard;
    // Count how many individual problems we actually have stored with dates
    const storedProblemsCount = problems.filter(p => p.platform === stat.platform).length;
    
    // If the true total is higher than our stored count, that difference is our starting line!
    if (totalAggregate > storedProblemsCount) {
      platformOffsets[stat.platform] = totalAggregate - storedProblemsCount;
    } else {
      platformOffsets[stat.platform] = 0;
    }
  });

  // 2. Build the trendline starting from the offset instead of 0
  problems.forEach((problem) => {
    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = new Map();
      // Initialize with the calculated offset (e.g., 122) instead of 0
      cumulativeCounts[problem.platform] = platformOffsets[problem.platform] || 0;
    }

    const dateKey = problem.solvedAt.toISOString().split("T")[0];
    cumulativeCounts[problem.platform] += 1; // Increment by 1 for each problem
    
    // Always overwrite the date key with the latest cumulative count for that day
    groupedByPlatform[problem.platform].set(dateKey, cumulativeCounts[problem.platform]);
  });

  // 3. Convert Map back to array format for the frontend chart
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