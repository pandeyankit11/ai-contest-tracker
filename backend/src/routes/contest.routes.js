const express = require("express");

const { syncContests, getAllContests } = require("../controllers/contest.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/sync", authenticate, syncContests);
router.get("/", authenticate, getAllContests);

module.exports = router;
