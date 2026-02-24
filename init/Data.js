const mongoose = require("mongoose");
const Post = require("../models/post");
const User = require("../models/user");
const { data } = require("./samplePosts"); 

mongoose.connect("mongodb://127.0.0.1:27017/communityx", {
  dbName: "communityx"
});


const seedDB = async () => {
  await Post.deleteMany({});

  // Create or find user
  let user = await User.findOne();
  if (!user) {
    user = new User({
      username: "seeduser",
      email: "seed@test.com",
      password: "password123"
    });
    await user.save();
  }

  const postsWithAuthor = data.map(post => ({
    ...post,
    author: user._id
  }));

  await Post.insertMany(postsWithAuthor);
  console.log("Posts seeded successfully!");
  mongoose.connection.close();
};

seedDB();
