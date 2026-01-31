const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const voteSchema = new Schema({
    value: {
        type: Number, 
        enum: [1, -1]
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "Post"
    }
});

module.exports = mongoose.model("Vote", voteSchema);
