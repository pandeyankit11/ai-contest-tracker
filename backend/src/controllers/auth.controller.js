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
    const userWithStats = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        contestAccounts: true,
        platformStats: true,
        ratingSnapshots: true, 
        solvedProblems: true,         
        contestParticipations: true,  
      },
    });

    const targetUser = userWithStats || req.user;

    // --- THE FIX: Javascript destructuring to safely extract everything EXCEPT the password ---
    const { password, ...safeUser } = targetUser;

    return res.status(200).json({
      success: true,
      data: {
        user: safeUser, // We only send the safe profile data!
      },
    });
  } catch (error) {
    console.error("PROFILE_FETCH_ERROR:", error.message);
    
    // Just in case it fails, we still make sure the fallback req.user doesn't leak it
    const { password, ...safeFallbackUser } = req.user;
    
    return res.status(200).json({
      success: true,
      data: {
        user: safeFallbackUser,
      },
    });
  }
});

const getTotalUsers = asyncHandler(async (req, res) => {
  const userCount = await prisma.user.count();
  
  res.status(200).json({
    success: true,
    totalUsers: userCount,
  });
});

module.exports = {
  login,
  me,
  register,
  getTotalUsers, 
};