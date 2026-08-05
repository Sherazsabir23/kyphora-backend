const express = require("express");

const router = express.Router();

const { jwtAuthMiddleware } = require("../middleware/jwt.middleware.js");

const { getSecurityOverview } = require("../controllers/security.controller");

router.use(jwtAuthMiddleware);

router.get("/overview", getSecurityOverview);

module.exports = router;