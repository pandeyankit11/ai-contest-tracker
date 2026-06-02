const express = require("express");

const {
  ratingHistory,
  difficultyBreakdown,
  topicBreakdown,
  activity,
  solvedTrends,
} = require("../controllers/analytics.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/rating-history", ratingHistory);
router.get("/difficulty-breakdown", difficultyBreakdown);
router.get("/topic-breakdown", topicBreakdown);
router.get("/activity", activity);
router.get("/solved-trends", solvedTrends);

module.exports = router;
