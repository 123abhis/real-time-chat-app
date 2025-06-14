import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: false
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    reactions: [{
      emoji: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    }],
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      type: {
        type: String,
        enum: ['image', 'file', 'audio'],
        required: true
      },
      url: String,
      name: String,
      size: Number
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Add a pre-save middleware to validate that either receiver or group is present
messageSchema.pre('save', function(next) {
  if (!this.receiver && !this.group) {
    next(new Error('Either receiver or group must be specified'));
  } else if (this.receiver && this.group) {
    next(new Error('Message cannot have both receiver and group'));
  } else {
    next();
  }
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
