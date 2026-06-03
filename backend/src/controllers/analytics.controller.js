const { prisma } = require("../config/prisma");
const {
  getRatingHistory,
  getDifficultyBreakdown,
  getTopicBreakdown,
  getActivity,
  getSolvedTrends,
} = require("../services/analytics.service");
const { syncAllUserData } = require("../services/codeforces.service");
const { syncLeetCodeAnalytics } = require("../services/leetcode.service");

// IMPORTANT NEW IMPORT: Bring in the contest service
const { syncAllContests } = require("../services/contest.service"); 
const { asyncHandler } = require("../utils/asyncHandler");

const ratingHistory = asyncHandler(async (req, res) => {
  const data = await getRatingHistory(req.user.id);
  res.status(200).json({ success: true, data });
});

const difficultyBreakdown = asyncHandler(async (req, res) => {
  const data = await getDifficultyBreakdown(req.user.id);
  res.status(200).json({ success: true, data });
});

const topicBreakdown = asyncHandler(async (req, res) => {
  const data = await getTopicBreakdown(req.user.id);
  res.status(200).json({ success: true, data });
});

const activity = asyncHandler(async (req, res) => {
  const data = await getActivity(req.user.id);
  res.status(200).json({ success: true, data });
});

const solvedTrends = asyncHandler(async (req, res) => {
  const data = await getSolvedTrends(req.user.id);
  res.status(200).json({ success: true, data });
});

const syncAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  console.log(`\n[CONTROLLER] --- Starting global sync for user ID: ${userId} ---`);

  const accounts = await prisma.contestAccount.findMany({
    where: { userId },
  });

  if (accounts.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No linked accounts found. Please link an account first.",
    });
  }

  const results = {};
  const errors = [];

  // 1. Sync User Analytics
  for (const account of accounts) {
    console.log(`[CONTROLLER] -> Processing platform: ${account.platform} (Handle: ${account.handle})`);
    try {
      if (account.platform === "CODEFORCES") {
        console.log(`[CONTROLLER] Bypassing Codeforces sync temporarily...`);
        continue; 
      } else if (account.platform === "LEETCODE") {
        console.log(`[CONTROLLER] Calling LeetCode analytics sync...`);
        results.LEETCODE = await syncLeetCodeAnalytics(userId, account.handle);
        console.log(`[CONTROLLER] LeetCode analytics sync SUCCESS.`);
      }
    } catch (error) {
      console.error(`[CONTROLLER] ERROR syncing ${account.platform}:`, error.message);
      errors.push({
        platform: account.platform,
        message: error.message || "Failed to sync platform",
      });
    }
  }

  // 2. NEW: Sync Upcoming Contests Globally
  try {
    console.log(`[CONTROLLER] -> Triggering global upcoming contests sync...`);
    // This will now call your perfectly fixed LeetCode fetcher!
    results.CONTESTS = await syncAllContests(); 
    console.log(`[CONTROLLER] Upcoming contests sync SUCCESS.`);
  } catch (error) {
    console.error(`[CONTROLLER] ERROR syncing contests:`, error.message);
  }

  console.log(`[CONTROLLER] --- Sync loop complete. Sending response. ---\n`);

  res.status(200).json({
    success: true,
    message: "Data synchronized successfully",
    data: results,
    errors: errors.length > 0 ? errors : undefined,
  });
});

module.exports = {
  ratingHistory,
  difficultyBreakdown,
  topicBreakdown,
  activity,
  solvedTrends,
  syncAnalytics,
};