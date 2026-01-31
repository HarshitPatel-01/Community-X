const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./comment");

const postSchema = new Schema({
  title: { type: String, required: true },
  text: String,

  image: {
    url: String,
    filename: String
  },

  subreddit: { type: String, default: "general" },

  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },

  votesBy: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      type: { type: String, enum: ["up", "down"] }
    }
  ],

  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  author: { type: Schema.Types.ObjectId, ref: "User", required: true }

}, { timestamps: true });

postSchema.post("findOneAndDelete", async (post) => {
  if (post) {
    await Comment.deleteMany({ _id: { $in: post.comments } });
  }
});

module.exports = mongoose.model("Post", postSchema);
