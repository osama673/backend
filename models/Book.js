const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    isBorrowed: {
      type: Boolean,
      required: false,
      default: false,
    },
    cover: {
      type: String,
      required: false,
      default: "",
    },
    dateOfPublication: {
      type: Date,
      default: new Date(),
    },
    language: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Book = mongoose.model("Book", BookSchema);
