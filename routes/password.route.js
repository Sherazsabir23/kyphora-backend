const express = require("express");

const router = express.Router();

const {jwtAuthMiddleware} = require("../middleware/jwt.middleware.js");

const {
  createPassword,
  getPasswords,
  getPassword,
  updatePassword,
  deletePassword,
} = require("../controllers/password.controller");

router.use(jwtAuthMiddleware);

router.post("/", createPassword);

router.get("/", getPasswords);

router.get("/:id", getPassword);

router.put("/:id", updatePassword);

router.delete("/:id", deletePassword);

module.exports = router;