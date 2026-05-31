const express = require("express");

const { getProfile } = require("../controllers/codeforces.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/profile", authenticate, getProfile);

module.exports = router;
