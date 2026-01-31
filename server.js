require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const User = require("./models/user");

const server = express();

/* DB */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* Middleware */
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "public")));

server.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

server.use(flash());

server.use(async (req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.session.userId
    ? await User.findById(req.session.userId)
    : null;
  next();
});

/* View Engine */
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "ejs");

/* Routes */
server.use("/", authRoutes);
server.use("/", postRoutes);

/* Server */
server.listen(process.env.PORT, () => {
  console.log("Server started");
});
