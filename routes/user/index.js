const express = require("express");
const route = express.Router();
const UsersModel = require("../../models/User");
const CommentsModel = require("../../models/Comment");
const jwt = require("jsonwebtoken");
const { compareSync } = require("bcryptjs");
const Book = require("../../models/Book");
const Reservation = require("../../models/Reservation");
const jwtMiddleware = require("../../middlewares/jwtMiddleware");
const bcrypt = require("bcryptjs");
require("dotenv").config();

//login
route.post("/login", async (req, res, next) => {
  try {
    const { email, pwd } = req.body;
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Authentication failed. User not found." });
    }

    if (!compareSync(pwd, user.password)) {
      return res
        .status(401)
        .json({ message: "Authentication failed. Wrong password." });
    }

    const key = process.env.KEY;
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        isUser: user.isUser,
      },
      key,
      {
        expiresIn: 86400,
      }
    );

    res.status(200).json({
      status: true,
      data: {
        id: user._id,
        isAdmin: user.isAdmin,
        isUser: user.isUser,
        token,
      },
    });
  } catch (err) {
    console.error("login error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});
// register
route.post("/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const user = new UsersModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const savedUser = await user.save();
    //
    res.status(200).json({ status: true, data: savedUser });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// admin login

// admin get users
route.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find({ isAdmin: true });
    res.status(200).json({ status: true, data: users });
  } catch (err) {
    console.error("get users error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// get books
route.get("/books", async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json({ status: true, data: books });
  } catch (err) {
    console.error("get all books error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// Delete book
route.delete("/delete/:id", jwtMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    await Book.deleteOne({ _id: id });
    res
      .status(200)
      .json({ status: true, message: "Book deleted successfully." });
  } catch (err) {
    console.error("delete book error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// Edit book by id
route.put("/edit/:id", jwtMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      author,
      category,
      cover,
      fileName,
      isPublic,
      language,
    } = req.body;

    const oldBookVersion = await Book.findOne({ _id: id }).select(
      "isPublic dateOfPublication"
    );
    let dateOfPublication = oldBookVersion?.dateOfPublication;

    if (oldBookVersion.isPublic === false && isPublic === true) {
      dateOfPublication = new Date();
    }

    const updatedBook = await Book.updateOne(
      { _id: id },
      {
        title,
        description,
        author,
        category,
        cover,
        fileName,
        isPublic,
        language,
        dateOfPublication,
      }
    );

    res.status(200).json({ status: true, data: updatedBook });
  } catch (err) {
    console.error("edit book error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// Get book by id
route.get("/book/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findOne({ _id: id });
    res.status(200).json({ status: true, data: book });
  } catch (err) {
    console.error("get one book error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.get("/my-reservations/:id", async (req, res, next) => {
  try {
    const reservations = await Reservation.find({
      user: req.params.id,
    }).populate("book", "title category", Book);
    res.json(reservations);
  } catch (err) {
    console.error("create error :", err);
    next(err);
  }
});

// confirm reservation
route.put("/confirmed/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dateOfReturn } = req.body;

    const reservation = await Reservation.updateOne(
      { _id: id },
      { isConfirmed: true, dateOfReturn }
    );

    await Book.findByIdAndUpdate(reservation.book, {
      $set: { isBorrowed: true },
    });

    res.status(200).json({ status: true, data: reservation });
  } catch (err) {
    console.error("confirm reservation error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.put("/returned/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.updateOne(
      { _id: id },
      { isReturned: true }
    );

    await Book.findByIdAndUpdate(reservation.book, {
      $set: { isBorrowed: false },
    });

    res.status(200).json({ status: true, data: reservation });
  } catch (err) {
    console.error("return reservation error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.get("/reservation/details/:user/:book", async (req, res) => {
  try {
    const { user, book } = req.params;
    const reservation = await Reservation.findOne({
      book: book,
      user: user,
    });
    res.json({ status: true, data: reservation });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.post("/reservation/create", async (req, res, next) => {
  try {
    const { bookId, userId } = req.body;
    const reservation = await Reservation.create({
      book: bookId,
      user: userId,
    });
    res.status(200).json({ status: true, data: reservation });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.get("/comment/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const commets = await CommentsModel.find({ book: bookId })
      .populate("user", "firstName lastName", UsersModel)
      .sort({ createdAt: -1 });
    res.json({ status: true, data: commets });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.post("/comment/create", async (req, res) => {
  try {
    const { comment, book, user } = req.body;
    const doc = await CommentsModel.create({ comment, book, user });
    res.json({ status: true, data: doc });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});
module.exports = route;
