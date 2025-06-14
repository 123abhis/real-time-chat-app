import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ['admin', 'moderator', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    groupPicture: {
      type: String,
      default: "https://icon-library.com/images/group-icon/group-icon-15.jpg",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteLink: {
      type: String,
      unique: true,
      sparse: true
    },
    settings: {
      onlyAdminsCanMessage: {
        type: Boolean,
        default: false
      },
      onlyAdminsCanEditInfo: {
        type: Boolean,
        default: true
      },
      onlyAdminsCanAddMembers: {
        type: Boolean,
        default: true
      }
    },
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }]
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group; 