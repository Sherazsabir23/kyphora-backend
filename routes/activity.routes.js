const express = require("express");

const router = express.Router();

const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js");

const { getActivityLogs } = require("../controllers/activity.controller");

router.use(jwtAuthMiddleware);

router.get("/", getActivityLogs);

module.exports = router;