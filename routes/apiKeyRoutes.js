const express = require("express");
const{
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
} = require("../controllers/apiKeyController.js");

const{jwtAuthMiddleware} = require( "../middleware/jwt.middleware.js");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.get("/", getApiKeys);

router.post("/", createApiKey);

router.put("/:id", updateApiKey);

router.delete("/:id", deleteApiKey);
module.exports = router;