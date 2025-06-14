import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import GroupDetails from "./GroupDetails";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import EncryptedMessage from "./EncryptedMessage";
import TranslatedMessage from "./TranslatedMessage";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [message, setMessage] = useState("");
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [encryptionPassword, setEncryptionPassword] = useState("");

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedImage) return;

    try {
      const messageData = {
        text: message,
        receiver: selectedUser._id,
        image: selectedImage,
        password: encryptionPassword || undefined,
      };

      await sendMessage(messageData);
      setMessage("");
      setSelectedImage(null);
      setEncryptionPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const isGroup = selectedUser?.members;

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-base-300 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={isGroup ? selectedUser.groupPicture : selectedUser.profilePic || "/avatar.png"}
            alt={isGroup ? selectedUser.name : selectedUser.fullName}
            className="size-10 rounded-full"
          />
          <div>
            <div className="font-medium">{isGroup ? selectedUser.name : selectedUser.fullName}</div>
            {!isGroup && (
              <div className="text-sm text-zinc-400">
                {selectedUser.online ? "Online" : "Offline"}
              </div>
            )}
          </div>
        </div>
        {isGroup && (
          <button
            onClick={() => setShowGroupDetails(!showGroupDetails)}
            className="btn btn-ghost btn-sm"
          >
            <Users className="size-5" />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`chat ${
              msg.sender === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    msg.sender === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : isGroup 
                        ? selectedUser.members.find(m => m.user === msg.sender)?.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(msg.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {msg.content && (
                <TranslatedMessage content={msg.content} isEncrypted={msg.isEncrypted} />
              )}
              {(msg.image || (msg.attachments && msg.attachments[0]?.url)) && (
                <img
                  src={msg.image || msg.attachments[0].url}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {msg.isEncrypted && msg.sender !== authUser._id ? (
                <EncryptedMessage message={msg} />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-base-300">
        <MessageInput
          message={message}
          setMessage={setMessage}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          encryptionPassword={encryptionPassword}
          setEncryptionPassword={setEncryptionPassword}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Group Details Modal */}
      {showGroupDetails && isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-base-100 rounded-lg w-full max-w-md">
            <GroupDetails group={selectedUser} onClose={() => setShowGroupDetails(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
