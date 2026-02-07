require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

const server = express();

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= MIDDLEWARE ================= */
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "public")));
server.use(methodOverride("_method"));

/* ================= SESSION ================= */

server.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

/* ================= FLASH ================= */
server.use(flash());

/* ================= GLOBAL TEMPLATE DATA ================= */
server.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  // Always string
  res.locals.currentUser = req.session.username || null;

  // ID for DB logic
  res.locals.userId = req.session.userId || null;

  next();
});

/* ================= VIEW ENGINE ================= */
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "ejs");

/* ================= ROUTES ================= */
server.use("/", authRoutes);
server.use("/", postRoutes);
server.use("/", require("./routes/commentRoutes"));

/* ================= SERVER ================= */
server.listen(process.env.PORT, () => {
  console.log("Server started");
});
