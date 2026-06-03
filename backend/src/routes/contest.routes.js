const express = require("express");

const { 
  syncContests, 
  getAllContests, 
  getUpcoming,
  getContestHistory // <-- Added our new controller function
} = require("../controllers/contest.controller");

const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Apply authentication middleware to all routes below this line
router.use(authenticate);

router.post("/sync", syncContests);
router.get("/", getAllContests);
router.get("/upcoming", getUpcoming);

// --- NEW USER HISTORY ROUTE ---
router.get("/history", getContestHistory); // Maps to /api/contests/history

module.exports = router;