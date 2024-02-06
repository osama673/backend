const express = require("express");
const route = express.Router();
const UsersModel = require("../../models/User");
const jwt = require("jsonwebtoken");
const { compareSync } = require("bcryptjs");
const Book = require("../../models/Book");
const Reservation = require("../../models/Reservation");
const jwtMiddleware = require("../../middlewares/jwtMiddleware");
const bcrypt = require("bcryptjs");
require("dotenv").config();

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
    res.status(200).json({ status: true, data: savedUser });
  } catch (err) {
    console.error("create error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// admin login
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

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
        isUser: user.isUser,
      },
      "oussema-2024",
      {
        expiresIn: 86400,
      }
    );

    res.status(200).json({
      status: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          isUser: user.isUser,
        },
        token,
      },
    });
  } catch (err) {
    console.error("login error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// admin get users
route.get("/users", async (req, res, next) => {
  try {
    const users = await UsersModel.find({ isAdmin: true });
    res.status(200).json({ status: true, data: users });
  } catch (err) {
    console.error("get users error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// Create book
route.post("/create", jwtMiddleware, async (req, res, next) => {
  try {
    const {
      title,
      description,
      author,
      isPublic,
      category,
      cover,
      fileName,
      language,
    } = req.body;

    const book = new Book({
      title,
      description,
      author,
      isPublic,
      category,
      cover,
      fileName,
      language,
    });

    const savedBook = await book.save();

    res.status(200).json({
      status: true,
      data: savedBook,
    });
  } catch (err) {
    console.error("create book error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

// get books
route.get("/books", jwtMiddleware, async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json({ status: true, data: books });
  } catch (err) {
    console.error("get all books error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.get("/public/books", async (req, res, next) => {
  try {
    const books = await Book.find({ isPublic: true });
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

    const updatedBook = await Book.findByIdAndUpdate(id, {
      $set: { ...req.body },
    });

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
    const book = await Book.findById(id);
    res.status(200).json({ status: true, data: book });
  } catch (err) {
    console.error("get one book error :", err);
    res.status(400).json({ status: false, error: err.message });
  }
});

route.get("/reservations", async (req, res) => {
  try {
    let reservations = await Reservation.find()
      .populate("book")
      .populate("user", "firstName lastName email");
    res.status(200).json({ status: true, data: reservations });
  } catch (error) {
    if (error) throw error;
    res.status(400).json({ status: false, error });
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

module.exports = route;
