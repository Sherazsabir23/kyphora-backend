const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cardName: {
      type: String,
      required: true,
      trim: true,
    },

    cardHolderName: {
      type: String,
      required: true,
      trim: true,
    },

    encryptedCardNumber: {
      type: String,
      required: true,
    },

    encryptedCVV: {
      type: String,
      required: true,
    },

    expiryMonth: {
      type: String,
      required: true,
    },

    expiryYear: {
      type: String,
      required: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    cardType: {
      type: String,
      enum: ["Visa", "Mastercard", "Amex", "Other"],
      default: "Visa",
    },

    encryptedNotes: {
      type: String,
      default: "",
    },

    favorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Card", cardSchema);