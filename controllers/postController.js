const Post = require("../models/post");

// Home feed
exports.getHome = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author")
      .sort({ createdAt: -1 });  // newest first

    // top 4 trending posts
    const trendingPosts = await Post.find({})
      .populate("author")
      .sort({ votes: -1 })       // 🔥 trending logic
      .limit(4);

    res.render("listings/view", { posts, trendingPosts });

  } catch (err) {
    console.log(err);
    res.send("Error loading home");
  }
};

// Full trending page
exports.getTrending = async (req, res) => {
  try {
    const trendingPosts = await Post.find({})
      .populate("author")
      .sort({ votes: -1, createdAt: -1 }); // votes priority

    res.render("listings/trending", { posts: trendingPosts });

  } catch (err) {
    console.log(err);
    res.send("Error loading trending posts");
  }
};
