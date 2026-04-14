const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isLoggedIn } = require("../middleware/auth");

const moderateText = require("../utils/moderate");

router.get("/signup", authController.getSignup);
router.get("/login", authController.getLogin);

router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);

router.get("/logout", authController.logoutUser);

router.get("/settings", isLoggedIn, authController.getSettings);
router.post("/settings/password", isLoggedIn, authController.changePassword);

router.get("/debug/moderation", async (req, res) => {
  const testText = req.query.text || "This is a test message to check connectivity.";
  try {
    const result = await moderateText(testText);
    res.json({
      status: "success",
      message: "Node.js app attempted to contact the moderation service.",
      serviceUrl: process.env.MODERATION_SERVICE_URL || "NOT SET",
      result: result
    });
  } catch (err) {
    res.json({
      status: "error",
      error: err.message
    });
  }
});

module.exports = router;

