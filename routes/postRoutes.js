const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { isPostOwner } = require("../middleware/isPostOwner");
const Community = require("../models/community");


/* ================= HOME & TRENDING ================= */
router.get("/home", postController.getHome);
router.get("/trending", postController.getTrending);
router.get("/popular", postController.getPopular);


/* ================= CREATE POST ================= */

// Show create post page
router.get("/post/new", isLoggedIn, async (req, res) => {
  const communities = await Community.find({}).sort({ name: 1 });
  let selectedCommunity = null;
  if (req.query.community) {
    selectedCommunity = communities.find(
      c => c.name === req.query.community.toLowerCase()
    );
  }
  res.render("listings/new", { communities, selectedCommunity });
});

// Submit new post (global)
router.post(
  "/post/new",
  isLoggedIn,
  upload.single("image"),
  postController.createPost
);

// Submit new post (from community page)
router.post(
  "/r/:name/new",
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
