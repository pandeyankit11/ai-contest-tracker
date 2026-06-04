const express = require("express");
const rateLimit = require("express-rate-limit");

const { login, me, register } = require("../controllers/auth.controller");
const { env } = require("../config/env");
const { authenticate } = require("../middleware/auth.middleware");
const { login, register, me, getTotalUsers } = require("../controllers/auth.controller");
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

module.exports = router;
