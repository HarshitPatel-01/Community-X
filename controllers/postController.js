const Post = require("../models/post");
const Comment = require("../models/comment");


/* ================= HOME PAGE ================= */
exports.getHome = async (req, res) => {
  try {
    const posts = await Post.find({ author: { $exists: true } })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .limit(20);

    const trendingPosts = await Post.aggregate([
      { $addFields: { score: { $subtract: ["$upvotes", "$downvotes"] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 4 }
    ]);

    res.render("listings/view", {
      posts,
      trendingPosts,
      currentUser: req.session.userId
    });
  } catch (err) {
    console.error("HOME ERROR:", err);
    res.status(500).send("Error loading home");
  }
};

/* ================= TRENDING PAGE ================= */
exports.getTrending = async (req, res) => {
  try {
    const posts = await Post.aggregate([
      { $addFields: { score: { $subtract: ["$upvotes", "$downvotes"] } } },
      { $sort: { score: -1, createdAt: -1 } }
    ]);

    res.render("listings/trending", {
      posts,
      currentUser: req.session.userId
    });
  } catch (err) {
    console.error("TRENDING ERROR:", err);
    res.status(500).send("Error loading trending");
  }
};

/* ================= SINGLE POST ================= */
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username");

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const comments = await Comment.find({ post: post._id })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    let userVote = null;
    if (req.session.userId && post.votesBy?.length) {
      const vote = post.votesBy.find(
        v => String(v.user) === String(req.session.userId)
      );
      if (vote) userVote = vote.type;
    }

    res.render("listings/post", {
      post: { ...post.toObject(), userVote },
      comments,
      currentUser: req.session.userId
    });
  } catch (err) {
    console.error("POST PAGE ERROR:", err);
    res.status(500).send("Error loading post");
  }
};

/* ================= CREATE POST ================= */
exports.createPost = async (req, res) => {
  try {
    if (!req.session.userId) {
      req.flash("error", "Login required");
      return res.redirect("/login");
    }

    const title = req.body?.title?.trim();
    const text = req.body?.text?.trim(); // ✅ schema-aligned

    if (!title) {
      req.flash("error", "Title is required");
      return res.redirect("/home");
    }

    const newPost = new Post({
      title,
      text: text || "",
      author: req.session.userId,
      image: req.file ? req.file.filename : null
    });

    await newPost.save();
    req.flash("success", "Post created successfully");
    res.redirect("/home");
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    res.status(500).send("Error creating post");
  }
};

/* ================= VOTING LOGIC ================= */
const handleVote = async (req, res, voteType) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Login required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.votesBy = post.votesBy || [];
    const existingVote = post.votesBy.find(
      v => String(v.user) === String(userId)
    );

    if (!existingVote) {
      voteType === "up" ? post.upvotes++ : post.downvotes++;
      post.votesBy.push({ user: userId, type: voteType });

    } else if (existingVote.type === voteType) {
      if (voteType === "up" && post.upvotes > 0) post.upvotes--;
      if (voteType === "down" && post.downvotes > 0) post.downvotes--;
      post.votesBy = post.votesBy.filter(
        v => String(v.user) !== String(userId)
      );

    } else {
      if (voteType === "up") {
        if (post.downvotes > 0) post.downvotes--;
        post.upvotes++;
      } else {
        if (post.upvotes > 0) post.upvotes--;
        post.downvotes++;
      }
      existingVote.type = voteType;
    }

    await post.save();
    res.json({
      upvotes: post.upvotes,
      downvotes: post.downvotes
    });
  } catch (err) {
    console.error("VOTE ERROR:", err);
    res.status(500).json({ error: "Voting failed" });
  }
};

exports.upvoteAjax = (req, res) => handleVote(req, res, "up");
exports.downvoteAjax = (req, res) => handleVote(req, res, "down");

/* ================= DELETE POST ================= */
/* 🔒 Authorization handled by middleware */
exports.deletePost = async (req, res) => {
  try {
    await req.post.deleteOne(); // triggers cascade comment delete
    req.flash("success", "Post deleted successfully");
    res.redirect("/home");
  } catch (err) {
    console.error("DELETE ERROR:", err);
    req.flash("error", "Error deleting post");
    res.redirect("/home");
  }
};
