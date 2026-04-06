const Conversation = require("../models/conversation");
const Message = require("../models/message");
const generateAlias = require("../utils/aliasGenerator");

exports.getChatList = async (req, res) => {
  try {
    const userId = req.session.userId;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.render("chat/list", { conversations, userId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat list");
  }
};

exports.getChat = async (req, res) => {
  try {
    const userId = req.session.userId;
    const otherUserId = req.params.userId;

    if (String(userId) === String(otherUserId)) {
        return res.redirect("/chat");
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, otherUserId],
        aliases: {
          [userId]: generateAlias(),
          [otherUserId]: generateAlias()
        }
      });
      await conversation.save();
    }

    const messages = await Message.find({ conversation: conversation._id })
      .sort({ createdAt: 1 });

    res.render("chat/window", { 
      conversation, 
      messages, 
      userId,
      otherUserId,
      myAlias: conversation.aliases.get(userId),
      otherAlias: conversation.aliases.get(otherUserId)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
  }
};

exports.saveMessage = async (conversationId, senderId, content) => {
    try {
        const message = new Message({
            conversation: conversationId,
            sender: senderId,
            content
        });
        await message.save();

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id
        });
        return message;
    } catch (err) {
        console.error("Error saving message:", err);
    }
};
