const {
  getRatingHistory,
  getDifficultyBreakdown,
  getTopicBreakdown,
  getActivity,
  getSolvedTrends,
} = require("../services/analytics.service");
const { asyncHandler } = require("../utils/asyncHandler");

const ratingHistory = asyncHandler(async (req, res) => {
  const data = await getRatingHistory(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

const difficultyBreakdown = asyncHandler(async (req, res) => {
  const data = await getDifficultyBreakdown(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

const topicBreakdown = asyncHandler(async (req, res) => {
  const data = await getTopicBreakdown(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

const activity = asyncHandler(async (req, res) => {
  const data = await getActivity(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

const solvedTrends = asyncHandler(async (req, res) => {
  const data = await getSolvedTrends(req.user.id);

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  ratingHistory,
  difficultyBreakdown,
  topicBreakdown,
  activity,
  solvedTrends,
};
