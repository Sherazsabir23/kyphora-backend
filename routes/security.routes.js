const express = require("express");

const router = express.Router();

const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js");

const { getSecurityOverview } = require("../controllers/Security.controller.js");

router.use(jwtAuthMiddleware);

router.get("/overview", getSecurityOverview);

module.exports = router;