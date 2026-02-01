const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { isLoggedIn } = require("../middleware/auth");

router.post("/post/:id/comment", isLoggedIn, commentController.createComment);
router.post("/comment/:id/delete", isLoggedIn, commentController.deleteComment);

module.exports = router;
