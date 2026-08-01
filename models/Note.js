const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
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
    },

    encryptedContent: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Personal",
        "Work",
        "Finance",
        "Recovery",
        "Other",
      ],
      default: "Personal",
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

module.exports = mongoose.model("Note", noteSchema);