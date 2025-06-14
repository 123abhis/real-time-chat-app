import { X, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="border-b border-base-300 p-4 flex items-center gap-3">
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="flex-1">
        <h2 className="text-lg font-semibold">
          {selectedUser?.fullName || selectedUser?.name || "Chat"}
        </h2>
        {selectedUser && !selectedUser.members && (
          <p className="text-sm text-gray-500">
            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        )}
      </div>
      <button
        onClick={() => setSelectedUser(null)}
        className="btn btn-ghost btn-sm"
      >
        <X className="size-5" />
      </button>
    </div>
  );
};

export default ChatHeader;
