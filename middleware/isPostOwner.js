const Post = require("../models/post");

module.exports.isPostOwner = async (req, res, next) => {
  try {
    // 🔒 Not logged in
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const { id } = req.params;
    const post = await Post.findById(id);

    // ❌ Post not found
    if (!post) {
      return res.redirect("/home");
    }

    // ❌ Not the owner
    if (String(post.author) !== String(req.session.userId)) {
      return res.redirect("/home");
    }

    // ✅ Owner verified
    next();
  } catch (err) {
    console.error("isPostOwner error:", err);
    return res.redirect("/home");
  }
};
