const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const { isLoggedIn, isPostOwner } = require("../middleware/auth");
const upload = require("../middleware/upload");

/* ================= HOME & TRENDING ================= */
router.get("/home", postController.getHome);
router.get("/trending", postController.getTrending);

/* ================= CREATE POST ================= */
router.get("/post/new", isLoggedIn, (req, res) => {
  res.render("listings/new");
});

router.post(
  "/post/new",
  isLoggedIn,
  upload.single("image"),
  postController.createPost
);

/* ================= SINGLE POST ================= */
router.get("/post/:id", postController.getPost);

/* ================= VOTING (AJAX) ================= */
router.post("/api/post/:id/upvote", isLoggedIn, postController.upvoteAjax);
router.post("/api/post/:id/downvote", isLoggedIn, postController.downvoteAjax);

/* ================= DELETE POST ================= */
router.post(
  "/post/:id/delete",
  isLoggedIn,
  isPostOwner,
  postController.deletePost
);
module.exports = router;
