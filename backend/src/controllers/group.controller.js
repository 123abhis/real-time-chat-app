import Group from "../models/group.model.js";
import User from "../models/user.model.js";
import { generateInviteCode } from "../utils/generateInviteCode.js";

export const createGroup = async (req, res) => {
  try {
    const { name, members, description } = req.body;
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: "Invalid group data" });
    }

    // Add creator to members if not already included
    const creatorId = req.user._id;
    const creatorMember = {
      user: creatorId,
      role: 'admin',
      joinedAt: new Date()
    };

    // Check if creator is already in members
    const hasCreator = members.some(member => member.user.toString() === creatorId.toString());
    const allMembers = hasCreator ? members : [creatorMember, ...members];

    // Validate member roles
    const validMembers = allMembers.map(member => ({
      user: member.user,
      role: member.role || 'member',
      joinedAt: new Date()
    }));

    // Create group
    const group = await Group.create({
      name,
      description,
      creator: creatorId,
      members: validMembers
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("creator", "username profilePic")
      .populate("members.user", "username profilePic");

    res.status(201).json({
      success: true,
      group: populatedGroup
    });
  } catch (error) {
    console.error("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id
    }).populate('members.user', 'username profilePic');
    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'username profilePic')
      .populate('creator', 'username profilePic');
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { name, description, groupPicture, settings, members } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || (member.role !== 'admin' && group.settings.onlyAdminsCanEditInfo)) {
      return res.status(403).json({ error: "Not authorized to edit group" });
    }

    if (name) group.name = name;
    if (description) group.description = description;
    if (groupPicture) group.groupPicture = groupPicture;
    if (settings) group.settings = { ...group.settings, ...settings };
    if (members) group.members = members;

    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username profilePic')
      .populate('creator', 'username profilePic');
    
    res.status(200).json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to delete group" });
    }

    await Group.findByIdAndDelete(req.params.groupId);
    
    res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || (member.role !== 'admin' && group.settings.onlyAdminsCanAddMembers)) {
      return res.status(403).json({ error: "Not authorized to add members" });
    }

    if (group.members.some(m => m.user.toString() === userId)) {
      return res.status(400).json({ error: "User is already a member" });
    }

    group.members.push({ user: userId, role: 'member' });
    await group.save();
    
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to remove members" });
    }

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username profilePic')
      .populate('creator', 'username profilePic');
    
    res.status(200).json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to update roles" });
    }

    const targetMember = group.members.find(m => m.user.toString() === userId);
    if (!targetMember) {
      return res.status(404).json({ error: "Member not found" });
    }

    targetMember.role = role;
    await group.save();
    
    const updatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username profilePic')
      .populate('creator', 'username profilePic');
    
    res.status(200).json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json({ error: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Group creator cannot leave the group" });
    }

    group.members = group.members.filter(m => m.user.toString() !== req.user._id.toString());
    await group.save();
    
    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateInviteLink = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = group.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to generate invite link" });
    }

    const inviteCode = generateInviteCode();
    group.inviteLink = inviteCode;
    await group.save();
    
    res.status(200).json({ inviteLink: inviteCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinGroupByLink = async (req, res) => {
  try {
    const { inviteLink } = req.params;
    const group = await Group.findOne({ inviteLink });
    
    if (!group) {
      return res.status(404).json({ error: "Invalid invite link" });
    }

    if (group.members.some(m => m.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ error: "Already a member of this group" });
    }

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();
    
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 