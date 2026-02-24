require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const communityRoutes = require("./routes/communityRoutes");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");

if (!process.env.MONGO_URI || !process.env.SESSION_SECRET) {
  throw new Error("Missing environment variables");
}

const server = express();

/* ================= MIDDLEWARE ================= */
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, "public")));

/* ================= VIEW ENGINE ================= */
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "ejs");

/* ================= SESSION ================= */
server.use(
  session({
    name: "communityx.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }
  })
);

/* ================= FLASH ================= */
server.use(flash());

/* ================= GLOBAL TEMPLATE DATA ================= */
server.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  // Keep both for safety
  res.locals.currentUser = req.session.username || null;
  res.locals.userId = req.session.userId || null;

  next();
});

/* ================= ROUTES ================= */
server.use("/", authRoutes);
server.use("/", postRoutes);
server.use("/", commentRoutes);
server.use("/", communityRoutes);

/* ================= 404 HANDLER ================= */
server.use((req, res) => {
  res.status(404).render("error/404");
});

/* ================= DATABASE + SERVER ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error(err));
