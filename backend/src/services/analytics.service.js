const { prisma } = require("../config/prisma");

async function getRatingHistory(userId) {
  const snapshots = await prisma.ratingSnapshot.findMany({
    where: { userId },
    orderBy: [{ recordedAt: "desc" }],
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
      groupedByPlatform[snapshot.platform] = [];
    }
    groupedByPlatform[snapshot.platform].push({
      rating: snapshot.rating,
      maxRating: snapshot.maxRating,
      recordedAt: snapshot.recordedAt.toISOString(),
    });
  });

  const result = {};
  Object.entries(groupedByPlatform).forEach(([platform, ratings]) => {
    result[platform] = {
      history: ratings,
      latestRating: ratings[0]?.rating || null,
      maxRating: Math.max(...ratings.map((r) => r.maxRating || 0), 0),
    };
  });

  return result;
}

async function getDifficultyBreakdown(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: {
      platform: true,
      difficulty: true,
    },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = {
        easy: 0,
        medium: 0,
        hard: 0,
      };
    }

    const difficulty = problem.difficulty ? problem.difficulty.toLowerCase() : "unknown";
    if (difficulty in groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform][difficulty] += 1;
    }
  });

  return groupedByPlatform;
}

async function getTopicBreakdown(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: {
      platform: true,
      tags: true,
    },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = {};
    }

    if (Array.isArray(problem.tags)) {
      problem.tags.forEach((tag) => {
        if (!groupedByPlatform[problem.platform][tag]) {
          groupedByPlatform[problem.platform][tag] = 0;
        }
        groupedByPlatform[problem.platform][tag] += 1;
      });
    }
  });

  return groupedByPlatform;
}

async function getActivity(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: {
      platform: true,
      solvedAt: true,
    },
    orderBy: { solvedAt: "asc" },
  });

  const groupedByPlatform = {};

  problems.forEach((problem) => {
    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = {};
    }

    const dateKey = problem.solvedAt.toISOString().split("T")[0];

    if (!groupedByPlatform[problem.platform][dateKey]) {
      groupedByPlatform[problem.platform][dateKey] = 0;
    }

    groupedByPlatform[problem.platform][dateKey] += 1;
  });

  return groupedByPlatform;
}

async function getSolvedTrends(userId) {
  const problems = await prisma.solvedProblem.findMany({
    where: { userId },
    select: {
      platform: true,
      solvedAt: true,
    },
    orderBy: { solvedAt: "asc" },
  });

  const groupedByPlatform = {};
  const cumulativeCounts = {};

  problems.forEach((problem) => {
    if (!groupedByPlatform[problem.platform]) {
      groupedByPlatform[problem.platform] = [];
      cumulativeCounts[problem.platform] = 0;
    }

    const dateKey = problem.solvedAt.toISOString().split("T")[0];
    const existingEntry = groupedByPlatform[problem.platform].find(
      (entry) => entry.date === dateKey
    );

    if (existingEntry) {
      existingEntry.count += 1;
    } else {
      cumulativeCounts[problem.platform] += 1;
      groupedByPlatform[problem.platform].push({
        date: dateKey,
        count: cumulativeCounts[problem.platform],
      });
    }
  });

  return groupedByPlatform;
}

module.exports = {
  getRatingHistory,
  getDifficultyBreakdown,
  getTopicBreakdown,
  getActivity,
  getSolvedTrends,
};
