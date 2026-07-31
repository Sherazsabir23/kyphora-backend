const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    website: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    encryptedPassword: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["Work", "Personal", "Finance", "Social", "Other"],
      default: "Other",
    },

    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    favorite: {
      type: Boolean,
      default: false,
    },

    passwordStrength: {
      type: String,
      enum: ["Weak", "Medium", "Strong"],
      default: "Weak",
    },

    favicon: {
      type: String,
      default: "",
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Password", passwordSchema);