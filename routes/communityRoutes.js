const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const communityController = require("../controllers/communityController");
const postController = require("../controllers/postController");
const { isLoggedIn } = require("../middleware/auth");

/* ================= MULTER CONFIG ================= */

// 1️⃣ Define storage FIRST
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// 2️⃣ Then define upload
const upload = multer({ storage });

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
