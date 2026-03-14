const Post = require("../models/post");
const Comment = require("../models/comment");
const moderateText = require("../utils/moderate");

exports.createComment = async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).send("Login required");

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    // 🔥 TOXICITY CHECK
    const toxicityResult = await moderateText(req.body.text);
    if (toxicityResult.flagged) {
      req.flash("error", "⚠️ Your comment was flagged as toxic. Please revise and try again.");
      return res.redirect(`/post/${post._id}`);
    }

    const comment = new Comment({
      text: req.body.text,
      author: req.session.userId,
      post: post._id
    });

    await comment.save();
    post.comments.push(comment._id);
    await post.save();

    res.redirect(`/post/${post._id}`);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error adding comment");
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).send("Comment not found");

    // 🔐 Check ownership
    if (!comment.author.equals(req.session.userId))
      return res.status(403).send("Unauthorized");

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    await comment.deleteOne();

    res.redirect(`/post/${comment.post}`);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting comment");
  }
};
