const { prisma } = require("../config/prisma");
const { syncCodeforcesContests } = require("../services/contest.service");
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

module.exports = {
  syncContests,
  getAllContests,
};
