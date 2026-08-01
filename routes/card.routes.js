const express = require("express");

const {
  createCard,
  getCards,
  getCard,
  updateCard,
  deleteCard,
} = require("../controllers/card.controller");

const{jwtAuthMiddleware}= require("../middleware/jwt.middleware");

const router = express.Router();

router.use(jwtAuthMiddleware);

router.post("/", createCard);

router.get("/", getCards);

router.get("/:id", getCard);

router.put("/:id", updateCard);

router.delete("/:id", deleteCard);

module.exports = router;