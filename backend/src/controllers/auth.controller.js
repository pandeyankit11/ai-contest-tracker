const {
  validateLoginInput,
  validateRegisterInput,
} = require("../validators/auth.validator");
const { loginUser, registerUser } = require("../services/auth.service");
const { asyncHandler } = require("../utils/asyncHandler");

// THE FIX: Pointing exactly to where your prisma.js file lives
const prisma = require("../../prisma"); 

const register = asyncHandler(async (req, res) => {
  const input = validateRegisterInput(req.body);
  const authResult = await registerUser(input);

  res.status(201).json({
    success: true,
    data: authResult,
  });
});

const login = asyncHandler(async (req, res) => {
  const input = validateLoginInput(req.body);
  const authResult = await loginUser(input);

  res.status(200).json({
    success: true,
    data: authResult,
  });
});

const me = asyncHandler(async (req, res) => {
  // Fetch the full user details along with their platform standings
  const userWithStats = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      platforms: true, // This fetches LeetCode/Codeforces data linked to this user
    },
  });

  res.status(200).json({
    success: true,
    data: {
      user: userWithStats,
    },
  });
});

module.exports = {
  login,
  me,
  register,
};