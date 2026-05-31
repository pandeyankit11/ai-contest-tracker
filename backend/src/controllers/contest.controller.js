const { prisma } = require("../config/prisma");
const { syncCodeforcesContests, getUpcomingContests } = require("../services/contest.service");
const { validateUpcomingContestsQuery } = require("../validators/contest.validator");
const { asyncHandler } = require("../utils/asyncHandler");

const syncContests = asyncHandler(async (req, res) => {
  const results = await syncCodeforcesContests();

  res.status(200).json({
    success: true,
    data: results,
  });
});

const getAllContests = asyncHandler(async (req, res) => {
  const contests = await prisma.contest.findMany({
    orderBy: [{ startTime: "asc" }],
  });

  res.status(200).json({
    success: true,
    data: contests,
  });
});

const getUpcoming = asyncHandler(async (req, res) => {
  const queryParams = validateUpcomingContestsQuery(req.query);
  const result = await getUpcomingContests(queryParams);

  res.status(200).json({
    success: true,
    data: result.contests,
    pagination: result.pagination,
  });
});

module.exports = {
  syncContests,
  getAllContests,
  getUpcoming,
};
