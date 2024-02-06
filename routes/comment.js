const express = require("express");
const commentRouter = express.Router();
const CommentsModel = require("../models/Comment");
const UserModel = require("../models/User");

// Create comment
commentRouter.post("/create", async (req, res, next) => {
  try {
    const { comment, book, author } = req.body;
    const doc = await CommentsModel.create({ comment, book, author });
    res.json(doc);
  } catch (err) {
    console.error("create error :", err);
    next(err);
  }
});

commentRouter.get("/:bookId", async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const commets = await CommentsModel.find({ book: bookId })
      .populate("author", "firstName lastName", UserModel)
      .sort({ createdAt: -1 });
    res.json(commets);
  } catch (err) {
    console.error("create error :", err);
    next(err);
  }
});

module.exports = commentRouter;
