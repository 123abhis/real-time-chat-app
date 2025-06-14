import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, X, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { getUsers, users, createGroup, isUsersLoading } = useChatStore();
  const { authUser } = useAuthStore();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = users?.filter(
    (user) =>
      user?._id !== authUser?._id &&
      user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleUserSelect = (user) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setIsCreating(true);
      const result = await createGroup({
        name: groupName,
        members: selectedUsers.map(user => ({
          user: user._id,
          role: 'member',
          joinedAt: new Date()
        })),
        description: groupDescription
      });
      
      if (result.success) {
        toast.success("Group created successfully!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  if (isUsersLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-base-300 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="size-5" />
          </button>
          <h1 className="text-xl font-semibold">Create New Group</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Group Name</span>
          </label>
          <input
            type="text"
            placeholder="Enter group name"
            className="input input-bordered"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Search Members</span>
          </label>
          <input
            type="text"
            placeholder="Search users..."
            className="input input-bordered"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className={`
                    w-full p-3 flex items-center gap-3 rounded-lg
                    hover:bg-base-300 transition-colors
                    ${selectedUsers.find((u) => u._id === user._id)
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""}
                  `}
                >
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-10 object-cover rounded-full"
                  />
                  <span className="font-medium flex-1">{user.fullName}</span>
                  {selectedUsers.find((u) => u._id === user._id) && (
                    <Check className="size-5 text-primary" />
                  )}
                </button>
              ))
            ) : (
              <div className="text-center text-base-content/60 py-4">
                No users found
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-base-300 pt-4">
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupPage; 