const createError = require("http-errors");
const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();

const PORT = process.env.PORT || 5000;

// DB Connection
const mongoDB = process.env.MONGODB_URI;

mongoose
  .connect(mongoDB)
  .then(() => console.log("connected to database"))
  .catch((reason) => {
    console.error("Could not connect to database");
    console.error(reason);
    process.exit(1);
  });

// built in middlewares
//  app.use(bodyParser.urlencoded({ extended: false }));
//  app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// app.use(function (req, res, next) {
//   const start = new Date().getTime();
//   res.on("finish", function () {
//     const elapsed = new Date().getTime() - start;
//     console.info(
//       `${req.method} ${req.originalUrl} ${res.statusCode} ${elapsed}ms`
//     );
//   });
//   next();
// });

// api middlewares
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));

app.get("/getMyRev", async (req, res) => {
  try {
    res.status(200).json({ status: true, message: "ok" });
  } catch (error) {
    if (error) throw error;
    res.status(400).json({ status: false, error });
  }
});
// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function (err, req, res, next) {
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   res.status(err.status || 500);
//   res.json("error");
// });

app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
