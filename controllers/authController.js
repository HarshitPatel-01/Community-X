const User = require("../models/user");
const bcrypt = require("bcrypt");

/* ================= SHOW PAGES ================= */

// Signup page
exports.getSignup = (req, res) => {
  res.render("auth/signup");
};

// Login page
exports.getLogin = (req, res) => {
  res.render("auth/login");
};


/* ================= SIGNUP ================= */
exports.signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const cleanUsername = username.trim();
    const cleanEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existingUser) {
      req.flash("error", "Username or Email already exists!");
      return res.redirect("/signup");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword
    });

    req.flash("success", "Account created! Please login.");
    res.redirect("/login");

  } catch (err) {
    console.log(err);
    req.flash("error", "Signup failed!");
    res.redirect("/signup");
  }
};


/* ================= LOGIN ================= */
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash("error", "Invalid email or password");
      return res.redirect("/login");
    }

    // 🔥 Save login session
    req.session.userId = user._id;
    req.session.username = user.username;

    req.flash("success", `Welcome back, ${user.username}!`);
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    req.flash("error", "Login failed");
    res.redirect("/login");
  }
};


/* ================= LOGOUT ================= */
exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.clearCookie("connect.sid");
    res.redirect("/home");
  });
};


/* ================= SETTINGS PAGE ================= */
exports.getSettings = (req, res) => {
  res.render("auth/settings");
};


/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match.");
      return res.redirect("/settings");
    }

    if (newPassword.length < 6) {
      req.flash("error", "Password must be at least 6 characters.");
      return res.redirect("/settings");
    }

    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      req.flash("error", "Current password is incorrect.");
      return res.redirect("/settings");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    req.flash("success", "Password updated successfully.");
    res.redirect("/settings");

  } catch (err) {
    console.log("CHANGE PASSWORD ERROR:", err);
    req.flash("error", "Failed to update password.");
    res.redirect("/settings");
  }
};
