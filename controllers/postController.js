const Post = require("../models/post");
const Comment = require("../models/comment");
const moderateText = require("../utils/moderate");

/* ================= HOME PAGE ================= */
exports.getHome = async (req, res) => {
  try {
    let userCommunities = [];
    if (req.session.userId) {
      // Since community model has members array but User might not have communities array, let's fetch communities where user is a member.
      const joinedComms = await require("../models/community").find({ members: req.session.userId }).select("_id");
      userCommunities = joinedComms.map(c => c._id);
    }

    const posts = await Post.find({
      author: { $exists: true },
      $or: [
        { community: null },
        { isPublic: true },
        { community: { $in: userCommunities } }
      ]
    })
      .populate("author", "username")
      .populate("community", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    const topCommunities = await Community.find({})
      .sort({ memberCount: -1 })
      .limit(5);

    res.render("listings/view", {
      posts,
      topCommunities
    });

  } catch (err) {
    console.log("HOME ERROR:", err);
    res.status(500).send("Error loading home");
  }
};


/* ================= TRENDING PAGE ================= */
exports.getTrending = async (req, res) => {
  try {
    let userCommunities = [];
    if (req.session.userId) {
      const joinedComms = await require("../models/community").find({ members: req.session.userId }).select("_id");
      userCommunities = joinedComms.map(c => c._id);
    }

    const posts = await Post.aggregate([
      {
        $match: {
          $or: [
            { community: null },
            { isPublic: true },
            { community: { $in: userCommunities } }
          ]
        }
      },
      { $addFields: { score: { $subtract: ["$upvotes", "$downvotes"] } } },
      { $sort: { score: -1, createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDoc"
        }
      },
      {
        $lookup: {
          from: "communities",
          localField: "community",
          foreignField: "_id",
          as: "communityDoc"
        }
      },
      {
        $addFields: {
          authorName: { $arrayElemAt: ["$authorDoc.username", 0] },
          communityName: { $arrayElemAt: ["$communityDoc.name", 0] }
        }
      },
      { $project: { authorDoc: 0, communityDoc: 0 } }
    ]);

    res.render("listings/trending", { posts });

  } catch (err) {
    console.log("TRENDING ERROR:", err);
    res.status(500).send("Error loading trending");
  }
};


/* ================= POPULAR PAGE ================= */
exports.getPopular = async (req, res) => {
  try {
    let userCommunities = [];
    if (req.session.userId) {
      const joinedComms = await require("../models/community").find({ members: req.session.userId }).select("_id");
      userCommunities = joinedComms.map(c => c._id);
    }

    // Get top posts by score (upvotes - downvotes)
    const popularPosts = await Post.aggregate([
      {
        $match: {
          $or: [
            { community: null },
            { isPublic: true },
            { community: { $in: userCommunities } }
          ]
        }
      },
      { $addFields: { score: { $subtract: ["$upvotes", "$downvotes"] } } },
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDoc"
        }
      },
      {
        $lookup: {
          from: "communities",
          localField: "community",
          foreignField: "_id",
          as: "communityDoc"
        }
      },
      {
        $addFields: {
          authorName: { $arrayElemAt: ["$authorDoc.username", 0] },
          communityName: { $arrayElemAt: ["$communityDoc.name", 0] }
        }
      },
      { $project: { authorDoc: 0, communityDoc: 0 } }
    ]);

    // Get top communities by member count
    const Community = require("../models/community");
    const popularCommunities = await Community.find({})
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(10);

    res.render("listings/popular", {
      posts: popularPosts,
      communities: popularCommunities
    });

  } catch (err) {
    console.log("POPULAR ERROR:", err);
    res.status(500).send("Error loading popular");
  }
};


/* ================= EXPLORE PAGE ================= */
exports.getExplore = async (req, res) => {
  try {
    let userCommunities = [];
    if (req.session.userId) {
      const joinedComms = await require("../models/community").find({ members: req.session.userId }).select("_id");
      userCommunities = joinedComms.map(c => c._id);
    }

    const posts = await Post.find({
      author: { $exists: true },
      $or: [
        { community: null },
        { isPublic: true },
        { community: { $in: userCommunities } }
      ]
    })
      .populate("author", "username")
      .populate("community", "name")
      .sort({ createdAt: -1 })
      .limit(30);

    const Community = require("../models/community");
    const topCommunities = await Community.find({})
      .sort({ memberCount: -1 })
      .limit(5);

    res.render("listings/explore", {
      posts,
      topCommunities
    });

  } catch (err) {
    console.log("EXPLORE ERROR:", err);
    res.status(500).send("Error loading explore");
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
      comments
    });

  } catch (err) {
    console.log("POST PAGE ERROR:", err);
    res.status(500).send("Error loading post");
  }
};


/* ================= CREATE POST ================= */
const Community = require("../models/community");

exports.createPost = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const { title, description, communityName, isPublic } = req.body;

    if (!title) return res.status(400).send("Title required");

    let communityId = null;
    let redirectUrl = "/home";
    let isPublicFlag = false;

    // 🔹 If community selected (Hybrid Mode)
    if (communityName && communityName.trim() !== "") {
      const community = await Community.findOne({
        name: communityName.toLowerCase()
      });

      if (community) {
        // Ensure user is member
        const isMember = community.members.some(
          id => String(id) === String(req.session.userId)
        );
        if (!isMember) {
          req.flash("error", "You must join the community to post in it.");
          return res.redirect(`/r/${community.name}`);
        }

        communityId = community._id;
        redirectUrl = `/r/${community.name}`;
        isPublicFlag = isPublic === "true" || isPublic === true;
      }
    }

    // TOXICITY CHECK
  const textToCheck = `${title} ${description || ""}`;

  const toxicityResult = await moderateText(textToCheck);

  console.log("Toxic detected:", toxicityResult);

  if (toxicityResult.flagged) {
    req.flash("error", "⚠️ Your post contains toxic language. Please revise it.");
    // Ensure we don't redirect to a non-existent POST-only route (like /r/:name/new)
    const referer = req.get("referer");
    if (referer && !referer.includes("/new") && !referer.includes("/post/new")) {
       return res.redirect(referer);
    }
    return res.redirect("/post/new");
  }

    const newPost = new Post({
      title: title.trim(),
      text: description?.trim() || "",
      author: req.session.userId,
      community: communityId,   
      isPublic: isPublicFlag,
      image: req.file
        ? {
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`
          }
        : null,
      upvotes: 0,
      downvotes: 0,
      votesBy: []
    });

    await newPost.save();

    res.redirect(redirectUrl);

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
