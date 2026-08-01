const express = require("express");

const router = express.Router();

const {jwtAuthMiddleware} = require("../middleware/jwt.middleware");

const {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
} = require("../controllers/note.controller");

router.use(jwtAuthMiddleware);

router.post("/", createNote);

router.get("/", getNotes);

router.get("/:id", getNote);

router.put("/:id", updateNote);

router.delete("/:id", deleteNote);

module.exports = router;