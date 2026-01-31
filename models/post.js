const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("./comment");

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    text: {
        type: String
    },
    image: {
        url: String,
        filename: String
    },
    subreddit: {
        type: String,
        default: "general"
    },
    upvotes: {
        type: Number,
        default: 0
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

/* Delete all comments when post deleted */
postSchema.post("findOneAndDelete", async (post) => {
    if (post) {
        await Comment.deleteMany({ _id: { $in: post.comments } });
    }
});

module.exports = mongoose.model("Post", postSchema);
