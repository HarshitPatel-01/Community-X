const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isLoggedIn } = require("../middleware/auth");

router.get("/signup", authController.getSignup);
router.get("/login", authController.getLogin);

router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);

router.get("/logout", authController.logoutUser);

router.get("/settings", isLoggedIn, authController.getSettings);
router.post("/settings/password", isLoggedIn, authController.changePassword);

module.exports = router;
