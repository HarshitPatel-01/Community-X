require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const http = require("http");
const { Server } = require("socket.io");

const communityRoutes = require("./routes/communityRoutes");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const chatController = require("./controllers/chatController");

if (!process.env.MONGO_URI || !process.env.SESSION_SECRET) {
  throw new Error("Missing environment variables");
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

/* ================= VIEW ENGINE ================= */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ================= SESSION ================= */
const sessionMiddleware = session({
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
});

app.use(sessionMiddleware);

// Share session with Socket.io
io.engine.use(sessionMiddleware);

/* ================= FLASH ================= */
app.use(flash());

/* ================= GLOBAL TEMPLATE DATA ================= */
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");

  res.locals.currentUser = req.session.username || null;
  res.locals.userId = req.session.userId || null;

  next();
});

/* ================= ROUTES ================= */
app.use("/", authRoutes);
app.use("/", postRoutes);
app.use("/", commentRoutes);
app.use("/", communityRoutes);
app.use("/", chatRoutes);

/* ================= SOCKET.IO LOGIC ================= */
io.on("connection", (socket) => {
  const session = socket.request.session;
  if (!session || !session.userId) {
    return socket.disconnect();
  }

  socket.on("join", (room) => {
    socket.join(room);
  });

  socket.on("chat message", async (data) => {
    const savedMsg = await chatController.saveMessage(data.conversationId, session.userId, data.content);
    if (savedMsg) {
      io.to(data.conversationId).emit("chat message", {
        content: savedMsg.content,
        senderAlias: data.senderAlias,
        senderId: session.userId,
        createdAt: savedMsg.createdAt
      });
    }
  });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).render("error/404");
});

/* ================= DATABASE + SERVER ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 3000;
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => console.error(err));

module.exports = app;
