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
    console.log("HOME ERROR:", err);
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

    res.render("listings/trending", { posts, currentUser: req.session.userId });

  } catch (err) {
    console.log("TRENDING ERROR:", err);
    res.status(500).send("Error loading trending");
  }
};


/* ================= SINGLE POST PAGE ================= */
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username");
    if (!post) return res.status(404).send("Post not found");

    const comments = await Comment.find({ post: post._id })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    let userVote = null;
    if (req.session.userId && post.votesBy) {
      const vote = post.votesBy.find(v => String(v.user) === String(req.session.userId));
      if (vote) userVote = vote.type;
    }

    res.render("listings/post", {
      post: { ...post.toObject(), userVote },
      comments,
      currentUser: req.session.userId
    });

  } catch (err) {
    console.log("POST PAGE ERROR:", err);
    res.status(500).send("Error loading post");
  }
};


/* ================= CREATE POST ================= */
exports.createPost = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const title = req.body?.title?.trim();
    const description = req.body?.description?.trim();

    if (!title) return res.status(400).send("Title is required");

    const newPost = new Post({
      title,
      description: description || "",
      author: req.session.userId,
      image: req.file ? req.file.filename : null, // 🔥 from multer
      upvotes: 0,
      downvotes: 0,
      votesBy: []
    });

    await newPost.save();
    res.redirect("/home");

  } catch (err) {
    console.log("CREATE POST ERROR:", err);
    res.status(500).send("Error creating post");
  }
};


/* ================= VOTING LOGIC ================= */
const handleVote = async (req, res, voteType) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Login required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.votesBy = post.votesBy || [];
    const existingVote = post.votesBy.find(v => String(v.user) === String(userId));

    if (!existingVote) {
      voteType === "up" ? post.upvotes++ : post.downvotes++;
      post.votesBy.push({ user: userId, type: voteType });

    } else if (existingVote.type === voteType) {
      voteType === "up" && post.upvotes > 0 ? post.upvotes-- : null;
      voteType === "down" && post.downvotes > 0 ? post.downvotes-- : null;
      post.votesBy = post.votesBy.filter(v => String(v.user) !== String(userId));

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
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });

  } catch (err) {
    console.log("VOTE ERROR:", err);
    res.status(500).json({ error: "Voting failed" });
  }
};

exports.upvoteAjax = (req, res) => handleVote(req, res, "up");
exports.downvoteAjax = (req, res) => handleVote(req, res, "down");


/* ================= DELETE POST ================= */
exports.deletePost = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    if (!post.author.equals(req.session.userId))
      return res.status(403).send("Unauthorized");

    await post.deleteOne();
    res.redirect("/home");

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).send("Error deleting post");
  }
};
