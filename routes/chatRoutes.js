const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { isLoggedIn } = require("../middleware/auth");

router.get("/chat", isLoggedIn, chatController.getChatList);
router.get("/chat/:userId", isLoggedIn, chatController.getChat);

module.exports = router;
