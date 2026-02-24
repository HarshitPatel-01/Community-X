const Community = require("../models/community");
const Post = require("../models/post");
const checkToxicity = require("../utils/toxic");

/* ================= CREATE COMMUNITY ================= */
exports.createCommunity = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    let { name, title, description } = req.body;

    name = name.trim().toLowerCase();
    title = title.trim();
    description = description?.trim() || "";

    if (!name || !title) {
      return res.status(400).send("Name and title are required");
    }

    // Prevent special characters
    const validName = /^[a-z0-9_]+$/;
    if (!validName.test(name)) {
      return res.status(400).send("Community name can only contain lowercase letters, numbers and underscore.");
    }

    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).send("Community already exists");
    }

    // Toxicity check
    const textToCheck = `${name} ${title} ${description}`;
    const toxicityScore = await checkToxicity(textToCheck);
    if (toxicityScore > 0.75) {
      req.flash("error", "Community content was flagged as inappropriate. Please revise.");
      return res.redirect("/community/new");
    }

    const community = new Community({
      name,
      title,
      description,
      image: req.file ? "/uploads/" + req.file.filename : "",
      creator: req.session.userId,
      members: [req.session.userId],
      memberCount: 1
    });

    await community.save();

    res.redirect(`/r/${community.name}`);

  } catch (err) {
    console.log("CREATE COMMUNITY ERROR:", err);
    res.status(500).send("Error creating community");
  }
};


/* ================= ALL COMMUNITIES ================= */
exports.getAllCommunities = async (req, res) => {
  try {
    const userId = req.session.userId;

    const communities = await Community.find({})
      .sort({ memberCount: -1, createdAt: -1 });

    const enriched = communities.map(c => {
      const isMember = userId
        ? c.members.some(id => String(id) === String(userId))
        : false;

      return {
        ...c.toObject(),
        isMember
      };
    });

    // Top 3 ranking
    const topCommunities = enriched.slice(0, 3);

    res.render("community/index", {
      communities: enriched,
      topCommunities,
      userId
    });

  } catch (err) {
    console.log("COMMUNITY LIST ERROR:", err);
    res.status(500).send("Error loading communities");
  }
};


/* ================= SINGLE COMMUNITY PAGE ================= */
exports.getCommunity = async (req, res) => {
  try {
    const community = await Community.findOne({
      name: req.params.name.toLowerCase()
    }).populate("creator", "username");

    if (!community) {
      return res.status(404).render("error/404");
    }

    const posts = await Post.find({
      community: community._id
    })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    const isMember =
      req.session.userId &&
      community.members.some(
        id => String(id) === String(req.session.userId)
      );

    res.render("community/show", {
      community,
      posts,
      isMember,
      userId: req.session.userId,
      currentUser: req.session.userId
    });

  } catch (err) {
    console.log("COMMUNITY PAGE ERROR:", err);
    res.status(500).send("Error loading community");
  }
};


/* ================= JOIN / LEAVE COMMUNITY ================= */
exports.toggleMembership = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const community = await Community.findById(req.params.id);
    if (!community) return res.redirect("/community");

    const userId = req.session.userId;

    const isMember = community.members.some(
      id => String(id) === String(userId)
    );

    if (isMember) {
      community.members.pull(userId);
    } else {
      community.members.push(userId);
    }

    community.memberCount = community.members.length;
    await community.save();

    res.redirect("/community");

  } catch (err) {
    console.log("JOIN ERROR:", err);
    res.status(500).send("Error updating membership");
  }
};


/* ================= DELETE COMMUNITY ================= */
exports.deleteCommunity = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const community = await Community.findById(req.params.id);
    if (!community) return res.redirect("/community");

    if (String(community.creator) !== String(req.session.userId)) {
      return res.status(403).send("Not authorized");
    }

    await Community.findByIdAndDelete(req.params.id);

    res.redirect("/community");

  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).send("Error deleting community");
  }
};


/* ================= SEARCH ================= */
exports.search = async (req, res) => {
  try {
    const query = req.query.q || "";
    const searchTerm = query.trim();

    if (!searchTerm) {
      return res.render("community/search", {
        query: "",
        posts: [],
        communities: [],
        userId: req.session.userId
      });
    }

    // Search communities (name, title, description)
    const communities = await Community.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } }
      ]
    })
      .sort({ memberCount: -1 })
      .limit(20);

    // Check membership status for logged-in users
    const enrichedCommunities = communities.map(c => {
      const isMember = req.session.userId
        ? c.members.some(id => String(id) === String(req.session.userId))
        : false;
      return { ...c.toObject(), isMember };
    });

    // Search posts (title and text)
    const posts = await Post.find({
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { text: { $regex: searchTerm, $options: "i" } }
      ]
    })
      .populate("author", "username")
      .populate("community", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("community/search", {
      query: searchTerm,
      posts,
      communities: enrichedCommunities,
      userId: req.session.userId
    });

  } catch (err) {
    console.log("SEARCH ERROR:", err);
    res.status(500).send("Error performing search");
  }
};
