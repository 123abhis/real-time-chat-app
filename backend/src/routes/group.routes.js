import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { 
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  updateMemberRole,
  leaveGroup,
  generateInviteLink,
  joinGroupByLink
} from "../controllers/group.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/create", createGroup);
router.get("/", getGroups);
router.get("/:groupId", getGroup);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);
router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:userId", removeMember);
router.put("/:groupId/members/:userId/role", updateMemberRole);
router.post("/:groupId/leave", leaveGroup);
router.post("/:groupId/invite-link", generateInviteLink);
router.post("/join/:inviteLink", joinGroupByLink);

export default router; 