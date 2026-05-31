const { getCodeforcesProfileForUser } = require("../services/codeforces.service");
const { asyncHandler } = require("../utils/asyncHandler");

const getProfile = asyncHandler(async (req, res) => {
  const profile = await getCodeforcesProfileForUser(req.user.id);

  res.status(200).json({
    success: true,
    data: profile,
  });
});

module.exports = {
  getProfile,
};
