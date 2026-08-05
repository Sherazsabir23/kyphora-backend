const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Matches the filter tabs in ActivityLogs.jsx exactly
    type: {
      type: String,
      enum: ["Login", "Vault Changes", "Security Events"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    device: {
      type: String,
      default: "Unknown device",
    },

    location: {
      type: String,
      default: "Unknown location",
    },

    ip: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);