const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  }
});

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: String,

    image: imageSchema,

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    upvotes: {
      type: Number,
      default: 0
    },

    downvotes: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Post || mongoose.model("Post", postSchema);
