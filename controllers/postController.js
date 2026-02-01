const Post = require("../models/post");

/* ================= HOME PAGE ================= */
exports.getHome = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author")
      .sort({ createdAt: -1 })
      .limit(20);

    const trendingPosts = await Post.aggregate([
      { $addFields: { score: { $subtract: ["$upvotes", "$downvotes"] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 4 }
    ]);

    res.render("listings/view", { posts, trendingPosts });

  } catch (err) {
    console.log(err);
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

    res.render("listings/trending", { posts });

  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading trending posts");
  }
};


/* ================= SINGLE POST ================= */
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author");
    if (!post) return res.status(404).send("Post not found");
    res.render("listings/post", { post });
  } catch (err) {
    console.log(err);
    res.status(500).send("Post not found");
  }
};


/* ================= CREATE POST ================= */
exports.createPost = async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).send("Login required");

    const newPost = new Post({
      title: req.body.title,
      description: req.body.description,
      author: req.session.userId
    });

    await newPost.save();
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error creating post");
  }
};


/* ================= UPVOTE ================= */
exports.downvoteAjax = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.votesBy = Array.isArray(post.votesBy) ? post.votesBy : [];

    const vote = post.votesBy.find(v => String(v.user) === String(userId));

    if (!vote) {
      post.downvotes++;
      post.votesBy.push({ user: userId, type: "down" });

    } else if (vote.type === "down") {
      post.downvotes--;
      post.votesBy = post.votesBy.filter(v => String(v.user) !== String(userId));

    } else {
      post.upvotes--;
      post.downvotes++;
      vote.type = "down";
    }

    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });

  } catch (err) {
    console.error("DOWNVOTE ERROR:", err);
    res.status(500).json({ error: "Voting failed" });
  }
};


/* ================= DOWNVOTE ================= */
exports.upvoteAjax = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.votesBy = Array.isArray(post.votesBy) ? post.votesBy : [];

    const vote = post.votesBy.find(v => String(v.user) === String(userId));

    if (!vote) {
      post.upvotes++;
      post.votesBy.push({ user: userId, type: "up" });

    } else if (vote.type === "up") {
      post.upvotes--;
      post.votesBy = post.votesBy.filter(v => String(v.user) !== String(userId));

    } else {
      post.downvotes--;
      post.upvotes++;
      vote.type = "up";
    }

    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });

  } catch (err) {
    console.error("UPVOTE ERROR:", err);
    res.status(500).json({ error: "Voting failed" });
  }
};

/* ================= DELETE POST ================= */
exports.deletePost = async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).send("Login required");

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (!post.author.equals(req.session.userId))
      return res.status(403).send("Unauthorized action");

    await post.deleteOne();
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error deleting post");
  }
};

/*==Update*/
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author")
      .populate({
        path: "comments",
        populate: { path: "author" }
      });

    if (!post) return res.status(404).send("Post not found");

    res.render("listings/post", { post });

  } catch (err) {
    res.status(500).send("Post not found");
  }
};

const Comment = require("../models/comment");

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author");

    const comments = await Comment.find({ post: post._id })
      .populate("author")
      .sort({ createdAt: -1 });

    res.render("listings/post", {
      post,
      comments,
      currentUser: req.session.userId
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Post not found");
  }
};
