import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Trash2, Shield, ShieldOff, UserMinus } from "lucide-react";
import toast from "react-hot-toast";

const GroupDetails = ({ group, onClose }) => {
  const { authUser } = useAuthStore();
  const { updateGroup, deleteGroup } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = group.members.find(
    (member) => member.user._id === authUser._id && member.role === "admin"
  );

  const handleRoleChange = async (memberId, newRole) => {
    if (!isAdmin) {
      toast.error("Only admins can change member roles");
      return;
    }

    try {
      setIsLoading(true);
      const updatedMembers = group.members.map((member) =>
        member.user._id === memberId
          ? { ...member, role: newRole }
          : member
      );

      await updateGroup(group._id, { members: updatedMembers });
      toast.success("Member role updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update member role");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) {
      toast.error("Only admins can remove members");
      return;
    }

    try {
      setIsLoading(true);
      const updatedMembers = group.members.filter(
        (member) => member.user._id !== memberId
      );

      await updateGroup(group._id, { members: updatedMembers });
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin) {
      toast.error("Only admins can delete the group");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteGroup(group._id);
      toast.success("Group deleted successfully");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to delete group");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{group.name}</h2>
        {isAdmin && (
          <button
            onClick={handleDeleteGroup}
            className="btn btn-error btn-sm"
            disabled={isLoading}
          >
            <Trash2 className="size-4" />
            <span className="hidden lg:inline ml-1">Delete Group</span>
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Members ({group.members.length})</h3>
        <div className="space-y-2">
          {group.members.map((member) => (
            <div
              key={member.user._id}
              className="flex items-center justify-between p-2 bg-base-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <img
                  src={member.user.profilePic || "/avatar.png"}
                  alt={member.user.username}
                  className="size-8 rounded-full"
                />
                <div>
                  <div className="font-medium">{member.user.username}</div>
                  <div className="text-sm text-zinc-400">
                    {member.role === "admin" ? "Admin" : "Member"}
                  </div>
                </div>
              </div>

              {isAdmin && member.user._id !== authUser._id && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleRoleChange(
                        member.user._id,
                        member.role === "admin" ? "member" : "admin"
                      )
                    }
                    className="btn btn-ghost btn-sm"
                    disabled={isLoading}
                    title={member.role === "admin" ? "Remove Admin" : "Make Admin"}
                  >
                    {member.role === "admin" ? (
                      <ShieldOff className="size-4" />
                    ) : (
                      <Shield className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.user._id)}
                    className="btn btn-ghost btn-sm text-error"
                    disabled={isLoading}
                    title="Remove Member"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails; 