const Post = require("../models/post");

/* ================= HOME PAGE ================= */
exports.getHome = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author")
      .sort({ createdAt: -1 });

    const trendingPosts = await Post.find({})
      .populate("author")
      .sort({ votes: -1 })
      .limit(4);

    res.render("listings/view", { posts, trendingPosts });

  } catch (err) {
    console.log(err);
    res.send("Error loading home");
  }
};

/* ================= TRENDING PAGE ================= */
exports.getTrending = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author")
      .sort({ votes: -1, createdAt: -1 });

    res.render("listings/trending", { posts });

  } catch (err) {
    console.log(err);
    res.send("Error loading trending posts");
  }
};

/* ================= SINGLE POST ================= */
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author");

    if (!post) {
      return res.send("Post not found");
    }

    res.render("listings/post", { post });

  } catch (err) {
    console.log(err);
    res.send("Post not found");
  }
};

/* ================= CREATE POST PAGE ================= */
exports.getCreatePost = (req, res) => {
  res.render("listings/new");
};

/* ================= CREATE POST LOGIC ================= */
exports.createPost = async (req, res) => {
  try {
    const { title, description } = req.body;

    const newPost = new Post({
      title,
      description,
      author: req.session.userId
    });

    await newPost.save();
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    res.send("Error creating post");
  }
};

/* ================= VOTE ================= */
exports.upvoteAjax = async (req, res) => {
  const userId = req.session.userId;
  const post = await Post.findById(req.params.id);

  const existingVote = post.votesBy.find(v => v.user.equals(userId));

  if (!existingVote) {
    post.upvotes++;
    post.votesBy.push({ user: userId, type: "up" });

  } else if (existingVote.type === "down") {
    post.downvotes--;
    post.upvotes++;
    existingVote.type = "up";
  }

  await post.save();

  // 🔥 RETURN EXACT FIELDS JS NEEDS
  res.json({
    upvotes: post.upvotes,
    downvotes: post.downvotes
  });
};
exports.downvoteAjax = async (req, res) => {
  const userId = req.session.userId;
  const post = await Post.findById(req.params.id);

  const existingVote = post.votesBy.find(v => v.user.equals(userId));

  if (!existingVote) {
    post.downvotes++;
    post.votesBy.push({ user: userId, type: "down" });

  } else if (existingVote.type === "up") {
    post.upvotes--;
    post.downvotes++;
    existingVote.type = "down";
  }

  await post.save();

  res.json({
    upvotes: post.upvotes,
    downvotes: post.downvotes
  });
};


/* ================= DELETE POST ================= */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.send("Post not found");
    }

    // Only post owner can delete
    if (!post.author.equals(req.session.userId)) {
      return res.send("Unauthorized action");
    }

    await post.deleteOne();
    res.redirect("/home");

  } catch (err) {
    console.log(err);
    res.send("Error deleting post");
  }
};
