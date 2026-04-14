const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const communityController = require("../controllers/communityController");
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/auth");

/* ================= GET ROUTES ================= */

// Search
router.get("/search", communityController.search);

// All communities
router.get("/community", communityController.getAllCommunities);
router.get("/explore", communityController.getAllCommunities);

// Create page
router.get("/community/new", isLoggedIn, (req, res) => {
  res.render("community/new");
});

// Single community
router.get("/r/:name", communityController.getCommunity);

/* ================= POST ROUTES ================= */

// Create community (WITH IMAGE UPLOAD)
router.post(
  "/community/new",
  isLoggedIn,
  upload.single("image"),  // 👈 VERY IMPORTANT
  communityController.createCommunity
);

// Join
router.post(
  "/community/:id/join",
  isLoggedIn,
  communityController.toggleMembership
);

// Delete
router.post(
  "/community/:id/delete",
  isLoggedIn,
  communityController.deleteCommunity
);

module.exports = router;
