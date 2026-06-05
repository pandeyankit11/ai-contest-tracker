const express = require("express");
const rateLimit = require("express-rate-limit");

const { env } = require("../config/env");
const { authenticate } = require("../middleware/auth.middleware");

// --- THE FIX 1: Imported updateProfile here ---
const { login, register, me, getTotalUsers, updateProfile } = require("../controllers/auth.controller");

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/total-users", getTotalUsers);
router.get("/me", authenticate, me);

// --- THE FIX 2: Used 'authenticate' instead of 'protect' ---
router.put("/update-profile", authenticate, updateProfile);

module.exports = router;