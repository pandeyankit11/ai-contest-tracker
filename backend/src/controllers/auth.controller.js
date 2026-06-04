const {
  validateLoginInput,
  validateRegisterInput,
} = require("../validators/auth.validator");
const { loginUser, registerUser } = require("../services/auth.service");
const { asyncHandler } = require("../utils/asyncHandler");

// The bulletproof Prisma import
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  try {
    // Fetch the user and specifically include the exact relation names from your schema
    const userWithStats = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        contestAccounts: true,
        platformStats: true,
        ratingSnapshots: true, 
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        user: userWithStats || req.user,
      },
    });
  } catch (error) {
    // If anything fails, log it but safely return the basic user so the app NEVER crashes
    console.error("PROFILE_FETCH_ERROR:", error.message);
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  }
});

module.exports = {
  login,
  me,
  register,
};