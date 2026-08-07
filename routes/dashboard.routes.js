const express = require("express");

const router = express.Router();

const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js");

const { getDashboardOverview } = require("../controllers/dashboard.controller");

router.use(jwtAuthMiddleware);

router.get("/overview", getDashboardOverview);

module.exports = router;