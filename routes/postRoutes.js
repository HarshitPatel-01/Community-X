const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/auth");


/* ================= HOME & TRENDING ================= */
router.get("/home", postController.getHome);
router.get("/trending", postController.getTrending);


/* ================= CREATE POST ================= */
router.get("/post/new", isLoggedIn, (req, res) => {
  res.render("listings/new");   // page render (no controller needed)
});

router.post("/post/new", isLoggedIn, postController.createPost);


/* ================= SINGLE POST ================= */
router.get("/post/:id", postController.getPost);


/* ================= VOTING ================= */
/* These match your frontend fetch(`/api/post/${id}/upvote`) */
router.post("/api/post/:id/upvote", postController.upvoteAjax);
router.post("/api/post/:id/downvote", postController.downvoteAjax);


/* ================= DELETE POST ================= */
router.post("/post/:id/delete", isLoggedIn, postController.deletePost);


module.exports = router;
