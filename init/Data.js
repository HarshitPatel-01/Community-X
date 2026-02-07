const mongoose = require("mongoose");
const Post = require("../models/post");
const User = require("../models/user");
const { data } = require("./SamplePosts");

mongoose.connect("mongodb://127.0.0.1:27017/CommunityX")
  .then(() => console.log("MongoDB connected for seeding"))
  .catch(err => console.error(err));

const seedDB = async () => {
  try {
    // Clear posts
    await Post.deleteMany({});
    console.log("Posts collection cleared");

    // Find or create seed user
    let user = await User.findOne({ email: "seed@test.com" });

    if (!user) {
      user = new User({
        username: "seeduser",
        email: "seed@test.com",
        password: "password123"
      });
      await user.save();
      console.log("Seed user created");
    }

    // Attach author to each post
    const postsWithAuthor = data.map(post => ({
      title: post.title,
      description: post.description,
      image: post.image,     
      author: user._id
    }));

    await Post.insertMany(postsWithAuthor);
    console.log("Posts seeded successfully!");

  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
