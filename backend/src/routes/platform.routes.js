const express = require("express");

const { create, list, remove } = require("../controllers/platform.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", create);
router.get("/", list);
router.delete("/:id", remove);

module.exports = router;
