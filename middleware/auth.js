const Post = require("../models/Post");

// AUTH: user must be logged in
exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    req.flash("error", "You must log in first!");
    return res.redirect("/login");
  }
  next();
};

// AUTHZ: only post owner allowed
exports.isPostOwner = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).select("author");

    if (!post) {
      req.flash("error", "Post not found");
      return res.redirect("/posts");
    }

    if (!post.author.equals(req.session.userId)) {
      req.flash("error", "You are not allowed to do that");
      return res.redirect("/posts");
    }

    req.post = post; // attach for controller use
    next();
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    return res.redirect("/posts");
  }
};
