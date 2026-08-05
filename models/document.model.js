const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
    },

    size: {
      type: String,
      required: true,
    },
    mimetype: {
  type: String,
  required: true,
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Document", documentSchema);