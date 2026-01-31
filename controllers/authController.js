const User = require("../models/user");
const bcrypt = require("bcrypt");

exports.getSignup = (req, res) => {
  res.render("auth/signup");
};

exports.getLogin = (req, res) => {
  res.render("auth/login");
};

exports.signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.flash("error", "Username already exists!");
      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    req.flash("success", "Account created! Please login.");
    res.redirect("/login");

  } catch (err) {
    console.log(err);
    req.flash("error", "Signup failed!");
    res.redirect("/signup");
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/login");
    }

    req.session.userId = user._id;
    req.flash("success", "Welcome back!");
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    req.flash("error", "Login failed");
    res.redirect("/login");
  }
};

exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/home");
  });
};
