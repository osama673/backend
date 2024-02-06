const mongoose = require("mongoose");

const CommentsSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    book: {
      type: mongoose.Types.ObjectId,
      ref: "books",
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = CommentsModel = mongoose.model("Comment", CommentsSchema);
