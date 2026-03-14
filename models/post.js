const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./comment");

const postSchema = new Schema(
  {
    /* ================= CONTENT ================= */
    title: {
      type: String,
      required: true,
      trim: true
    },

    text: {
      type: String,
      trim: true,
      default: ""
    },

    image: {
      type: {
        filename: String,
        url: String
      },
      default: null
    },

    /* ================= RELATIONS ================= */
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      default: null
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],

    /* ================= VISIBILITY ================= */
    isPublic: {
      type: Boolean,
      default: false
    },

    /* ================= VOTING ================= */
    upvotes: {
      type: Number,
      default: 0
    },

    downvotes: {
      type: Number,
      default: 0
    },

    votesBy: {
      type: [
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: "User"
          },
          type: {
            type: String,
            enum: ["up", "down"]
          }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

/* ================= CLEANUP ================= */
postSchema.post("findOneAndDelete", async function (post) {
  if (post) {
    await Comment.deleteMany({
      _id: { $in: post.comments }
    });
  }
});

module.exports = mongoose.model("Post", postSchema);
