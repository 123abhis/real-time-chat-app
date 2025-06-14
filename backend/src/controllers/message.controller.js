import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Group from "../models/group.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { encryptMessage, decryptMessage, filterBadWords, hasBadWords } from '../lib/utils.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const myId = req.user._id;

    // Check if the chatId is a group or user
    const group = await Group.findById(chatId);
    let messages;

    if (group) {
      // If it's a group, get group messages
      messages = await Message.find({
        group: chatId
      }).sort({ createdAt: 1 });
    } else {
      // If it's a user, get direct messages
      messages = await Message.find({
        $or: [
          { sender: myId, receiver: chatId },
          { sender: chatId, receiver: myId },
        ],
      }).sort({ createdAt: 1 });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiver, content, password, image } = req.body;
    const sender = req.user._id;

    // Validate required fields
    if (!receiver) {
      return res.status(400).json({
        success: false,
        message: 'Receiver is required'
      });
    }

    if (!content && !image) {
      return res.status(400).json({
        success: false,
        message: 'Content or image is required'
      });
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    let messageData = {
      sender,
      receiver,
      isEncrypted: !!password,
      password: password || null,
      hasProfanity: false
    };

    // Handle image upload if present
    if (image) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: "chat_images",
        });
        const imageUrl = result.secure_url;
        
        // Encrypt image URL if password is provided
        if (password) {
          messageData.image = encryptMessage(imageUrl, password);
        } else {
          messageData.image = imageUrl;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: error.message
        });
      }
    }

    // Handle text content
    if (content) {
      try {
        // Check if the content is just an emoji
        const isEmojiOnly = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAFF}\u{1FAD0}-\u{1FADF}\u{1FAE0}-\u{1FAFF}\u{1FB00}-\u{1FBFF}\u{1FC00}-\u{1FCFF}\u{1FD00}-\u{1FDFF}\u{1FE00}-\u{1FEFF}\u{1FF00}-\u{1FFFF}\u{2000}-\u{206F}\u{2070}-\u{209F}\u{20A0}-\u{20CF}\u{20D0}-\u{20FF}\u{2100}-\u{214F}\u{2150}-\u{218F}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}\u{2400}-\u{243F}\u{2440}-\u{245F}\u{2460}-\u{24FF}\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{27C0}-\u{27EF}\u{27F0}-\u{27FF}\u{2800}-\u{28FF}\u{2900}-\u{297F}\u{2980}-\u{29FF}\u{2A00}-\u{2AFF}\u{2B00}-\u{2BFF}\u{2C00}-\u{2C5F}\u{2C60}-\u{2C7F}\u{2C80}-\u{2CFF}\u{2D00}-\u{2D2F}\u{2D30}-\u{2D7F}\u{2D80}-\u{2DDF}\u{2DE0}-\u{2DFF}\u{2E00}-\u{2E7F}\u{2E80}-\u{2EFF}\u{2F00}-\u{2FDF}\u{2FF0}-\u{2FFF}\u{3000}-\u{303F}\u{3040}-\u{309F}\u{30A0}-\u{30FF}\u{3100}-\u{312F}\u{3130}-\u{318F}\u{3190}-\u{319F}\u{31A0}-\u{31BF}\u{31C0}-\u{31EF}\u{31F0}-\u{31FF}\u{3200}-\u{32FF}\u{3300}-\u{33FF}\u{3400}-\u{4DBF}\u{4DC0}-\u{4DFF}\u{4E00}-\u{9FFF}\u{A000}-\u{A48F}\u{A490}-\u{A4CF}\u{A4D0}-\u{A4FF}\u{A500}-\u{A63F}\u{A640}-\u{A69F}\u{A6A0}-\u{A6FF}\u{A700}-\u{A71F}\u{A720}-\u{A7FF}\u{A800}-\u{A82F}\u{A830}-\u{A83F}\u{A840}-\u{A87F}\u{A880}-\u{A8DF}\u{A8E0}-\u{A8FF}\u{A900}-\u{A92F}\u{A930}-\u{A95F}\u{A960}-\u{A97F}\u{A980}-\u{A9DF}\u{A9E0}-\u{A9FF}\u{AA00}-\u{AA5F}\u{AA60}-\u{AA7F}\u{AA80}-\u{AADF}\u{AAE0}-\u{AAFF}\u{AB00}-\u{AB2F}\u{AB30}-\u{AB6F}\u{AB70}-\u{ABBF}\u{ABC0}-\u{ABFF}\u{AC00}-\u{D7AF}\u{D7B0}-\u{D7FF}\u{F900}-\u{FAFF}\u{FB00}-\u{FB4F}\u{FB50}-\u{FDFF}\u{FE00}-\u{FE0F}\u{FE10}-\u{FE1F}\u{FE20}-\u{FE2F}\u{FE30}-\u{FE4F}\u{FE50}-\u{FE6F}\u{FE70}-\u{FEFF}\u{FF00}-\u{FFEF}\u{FFF0}-\u{FFFF}]$/u.test(content.trim());

        let processedContent;
        if (isEmojiOnly) {
          // For emoji-only messages, use the content as is
          processedContent = content;
        } else {
          // For regular messages, decode and process as before
          const contentWithSpaces = content.replace(/\+/g, ' ');
          processedContent = decodeURIComponent(contentWithSpaces);
        }

        // Filter bad words
        const filteredContent = filterBadWords(processedContent);
        messageData.hasProfanity = hasBadWords(processedContent);

        let encryptedContent = filteredContent;
        if (password) {
          encryptedContent = encryptMessage(filteredContent, password);
        }

        messageData.content = encryptedContent;
      } catch (error) {
        console.error('Error processing content:', error);
        return res.status(500).json({
          success: false,
          message: 'Error processing message content',
          error: error.message
        });
      }
    } else if (image) {
      // Set a default content for image-only messages
      messageData.content = "[Image]";
    }

    const message = new Message(messageData);
    await message.save();

    const receiverSocketId = getReceiverSocketId(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message.toObject()
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId, content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Filter bad words
    const filteredContent = filterBadWords(content);
    const hasProfanity = hasBadWords(content);

    let encryptedContent = filteredContent;
    if (message.isEncrypted && message.password) {
      encryptedContent = encryptMessage(filteredContent, message.password);
    }

    message.content = encryptedContent;
    message.isEdited = true;
    message.updatedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: {
        ...message.toObject(),
        hasProfanity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};

export const decryptMessageController = async (req, res) => {
  try {
    const { messageId, password } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is authorized to decrypt the message
    const isAuthorized = message.receiver?.toString() === userId.toString() || 
                        (message.group && await Group.findOne({
                          _id: message.group,
                          'members.user': userId
                        }));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to decrypt this message'
      });
    }

    if (!message.isEncrypted) {
      return res.status(400).json({
        success: false,
        message: 'Message is not encrypted'
      });
    }

    let decryptedData = {
      content: null,
      image: null,
      attachments: []
    };

    // Try to decrypt content first to verify password
    if (message.content && message.content !== "[Image]") {
      try {
        decryptedData.content = decryptMessage(message.content, password);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    // If we get here, the password is correct. Now decrypt other content
    if (message.image) {
      try {
        decryptedData.image = decryptMessage(message.image, password);
      } catch (error) {
        console.error('Error decrypting image:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to decrypt image URL: ' + error.message
        });
      }
    }

    if (message.attachments && message.attachments.length > 0) {
      try {
        decryptedData.attachments = message.attachments.map(attachment => ({
          ...attachment,
          url: decryptMessage(attachment.url, password)
        }));
      } catch (error) {
        console.error('Error decrypting attachments:', error);
        return res.status(400).json({
          success: false,
          message: 'Failed to decrypt attachment URLs: ' + error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Message decrypted successfully',
      data: decryptedData
    });
  } catch (error) {
    console.error('Error in decryptMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Error decrypting message',
      error: error.message
    });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, password, image } = req.body;
    const sender = req.user._id;

    // Validate required fields
    if (!content && !image) {
      return res.status(400).json({
        success: false,
        message: 'Content or image is required'
      });
    }

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const isMember = group.members.some(member => member.user.toString() === sender.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    let messageData = {
      sender,
      group: groupId,
      isEncrypted: !!password,
      password: password || null,
      hasProfanity: hasBadWords(content || '')
    };

    // Handle image upload if present
    if (image) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          folder: "chat_images",
        });
        const imageUrl = result.secure_url;
        
        // Encrypt image URL if password is provided
        if (password) {
          messageData.image = encryptMessage(imageUrl, password);
        } else {
          messageData.image = imageUrl;
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image',
          error: error.message
        });
      }
    }

    // Handle text content
    if (content) {
      // Filter bad words
      const filteredContent = filterBadWords(content);
      messageData.hasProfanity = hasBadWords(content);

      let encryptedContent = filteredContent;
      if (password) {
        encryptedContent = encryptMessage(filteredContent, password);
      }

      messageData.content = encryptedContent;
    } else if (image) {
      // Set a default content for image-only messages
      messageData.content = "[Image]";
    }

    const message = new Message(messageData);
    await message.save();

    // Emit the message to all group members
    io.to(groupId).emit("newGroupMessage", message);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message.toObject()
    });
  } catch (error) {
    console.error('Error in sendGroupMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};
