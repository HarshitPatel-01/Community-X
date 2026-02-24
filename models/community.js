const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      maxlength: 500,
      default: ""
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    image: { type: 
      String, default: "" 
    },
    memberCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Community", communitySchema);
