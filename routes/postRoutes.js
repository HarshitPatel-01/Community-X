const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/auth");
const upload = require("../middleware/upload"); // 🔥 ADD THIS
const multer = require("multer");


/* ================= HOME & TRENDING ================= */
router.get("/home", postController.getHome);
router.get("/trending", postController.getTrending);


/* ================= CREATE POST ================= */

// Show create post page
router.get("/post/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

// Submit new post (ORDER IS IMPORTANT)
router.post(
  "/post/new",
  isLoggedIn,              // 1️⃣ must be logged in
  upload.single("image"),  // 2️⃣ multer reads form + file
  postController.createPost // 3️⃣ controller runs
);


/* ================= SINGLE POST ================= */
router.get("/post/:id", postController.getPost);


/* ================= VOTING (AJAX) ================= */
router.post("/api/post/:id/upvote", isLoggedIn, postController.upvoteAjax);
router.post("/api/post/:id/downvote", isLoggedIn, postController.downvoteAjax);


/* ================= DELETE POST ================= */
router.post("/post/:id/delete", isLoggedIn, postController.deletePost);


module.exports = router;
