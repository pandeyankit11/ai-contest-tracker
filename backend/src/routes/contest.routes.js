const express = require("express");

const { syncContests, getAllContests, getUpcoming } = require("../controllers/contest.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/sync", authenticate, syncContests);
router.get("/", authenticate, getAllContests);
router.get("/upcoming", authenticate, getUpcoming);

module.exports = router;
