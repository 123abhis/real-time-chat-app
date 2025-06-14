import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  groups: [],

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const { authUser } = useAuthStore.getState();
      const res = await axiosInstance.post('/groups/create', {
        ...groupData,
        creator: authUser._id
      });
      
      if (res.data.success) {
        set((state) => ({
          groups: [...state.groups, res.data.group]
        }));
        return { success: true, data: res.data.group };
      } else {
        throw new Error(res.data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Failed to create group");
    }
  },

  getGroups: async () => {
    try {
      const res = await axiosInstance.get('/groups');
      if (res.data.success) {
        set({ groups: res.data.data });
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error(error.response?.data?.error || "Failed to fetch groups");
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error("Please select a user to send message");
      return;
    }

    try {
      const isGroup = selectedUser.members;
      const endpoint = isGroup ? `/messages/group/${selectedUser._id}` : '/messages/send';
      
      // Prepare the message data
      const messagePayload = {
        content: messageData.text || null,
        password: messageData.password || null,
        ...(isGroup ? {} : { receiver: selectedUser._id })
      };

      // Only include image if it exists
      if (messageData.image) {
        messagePayload.image = messageData.image;
      }

      // Handle content (including emoji-only messages)
      if (messagePayload.content) {
        // Check if the content is just an emoji
        const isEmojiOnly = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{1FAB0}-\u{1FABF}\u{1FAC0}-\u{1FAFF}\u{1FAD0}-\u{1FADF}\u{1FAE0}-\u{1FAFF}\u{1FB00}-\u{1FBFF}\u{1FC00}-\u{1FCFF}\u{1FD00}-\u{1FDFF}\u{1FE00}-\u{1FEFF}\u{1FF00}-\u{1FFFF}\u{2000}-\u{206F}\u{2070}-\u{209F}\u{20A0}-\u{20CF}\u{20D0}-\u{20FF}\u{2100}-\u{214F}\u{2150}-\u{218F}\u{2190}-\u{21FF}\u{2200}-\u{22FF}\u{2300}-\u{23FF}\u{2400}-\u{243F}\u{2440}-\u{245F}\u{2460}-\u{24FF}\u{2500}-\u{257F}\u{2580}-\u{259F}\u{25A0}-\u{25FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{27C0}-\u{27EF}\u{27F0}-\u{27FF}\u{2800}-\u{28FF}\u{2900}-\u{297F}\u{2980}-\u{29FF}\u{2A00}-\u{2AFF}\u{2B00}-\u{2BFF}\u{2C00}-\u{2C5F}\u{2C60}-\u{2C7F}\u{2C80}-\u{2CFF}\u{2D00}-\u{2D2F}\u{2D30}-\u{2D7F}\u{2D80}-\u{2DDF}\u{2DE0}-\u{2DFF}\u{2E00}-\u{2E7F}\u{2E80}-\u{2EFF}\u{2F00}-\u{2FDF}\u{2FF0}-\u{2FFF}\u{3000}-\u{303F}\u{3040}-\u{309F}\u{30A0}-\u{30FF}\u{3100}-\u{312F}\u{3130}-\u{318F}\u{3190}-\u{319F}\u{31A0}-\u{31BF}\u{31C0}-\u{31EF}\u{31F0}-\u{31FF}\u{3200}-\u{32FF}\u{3300}-\u{33FF}\u{3400}-\u{4DBF}\u{4DC0}-\u{4DFF}\u{4E00}-\u{9FFF}\u{A000}-\u{A48F}\u{A490}-\u{A4CF}\u{A4D0}-\u{A4FF}\u{A500}-\u{A63F}\u{A640}-\u{A69F}\u{A6A0}-\u{A6FF}\u{A700}-\u{A71F}\u{A720}-\u{A7FF}\u{A800}-\u{A82F}\u{A830}-\u{A83F}\u{A840}-\u{A87F}\u{A880}-\u{A8DF}\u{A8E0}-\u{A8FF}\u{A900}-\u{A92F}\u{A930}-\u{A95F}\u{A960}-\u{A97F}\u{A980}-\u{A9DF}\u{A9E0}-\u{A9FF}\u{AA00}-\u{AA5F}\u{AA60}-\u{AA7F}\u{AA80}-\u{AADF}\u{AAE0}-\u{AAFF}\u{AB00}-\u{AB2F}\u{AB30}-\u{AB6F}\u{AB70}-\u{ABBF}\u{ABC0}-\u{ABFF}\u{AC00}-\u{D7AF}\u{D7B0}-\u{D7FF}\u{F900}-\u{FAFF}\u{FB00}-\u{FB4F}\u{FB50}-\u{FDFF}\u{FE00}-\u{FE0F}\u{FE10}-\u{FE1F}\u{FE20}-\u{FE2F}\u{FE30}-\u{FE4F}\u{FE50}-\u{FE6F}\u{FE70}-\u{FEFF}\u{FF00}-\u{FFEF}\u{FFF0}-\u{FFFF}]$/u.test(messagePayload.content.trim());

        if (isEmojiOnly) {
          // For emoji-only messages, we don't need to encode
          messagePayload.content = messagePayload.content;
        } else {
          // For regular messages, encode as before
          const encodedContent = encodeURIComponent(messagePayload.content);
          messagePayload.content = encodedContent.replace(/%20/g, '+');
        }
      }

      const res = await axiosInstance.post(endpoint, messagePayload);

      if (res.data.success) {
        set({ messages: [...messages, res.data.data] });
        toast.success("Message sent successfully");
      } else {
        toast.error(res.data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // More detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        toast.error(error.response.data.message || error.response.data.error || "Failed to send message");
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request error:", error.request);
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        toast.error(error.message || "Failed to send message");
      }
    }
  },

  decryptMessage: async (messageId, password) => {
    try {
      const res = await axiosInstance.post('/messages/decrypt', {
        messageId,
        password
      });
      return res;
    } catch (error) {
      console.error("Error decrypting message:", error);
      throw error;
    }
  },

  editMessage: async (messageId, content) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.put(`/messages/edit`, {
        messageId,
        content
      });

      if (res.data.success) {
        // Update the message in the state
        const updatedMessages = messages.map((msg) =>
          msg._id === messageId ? { ...msg, content: content, isEdited: true } : msg
        );
        
        set({ messages: updatedMessages });
        
        // Emit socket event for real-time update
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("messageEdited", { _id: messageId, content });
        }
        
        return res.data;
      } else {
        const errorMsg = res.data.message || "Failed to edit message";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to edit message";
      toast.error(errorMsg);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    const { messages } = get();
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);

      if (res.data.success) {
        // Update the messages in the state
        const updatedMessages = messages.filter((msg) => msg._id !== messageId);
        set({ messages: updatedMessages });
        
        // Emit socket event for real-time update
        const socket = useAuthStore.getState().socket;
        if (socket) {
          socket.emit("messageDeleted", messageId);
        }
        
        return res.data;
      } else {
        const errorMsg = res.data.message || "Failed to delete message";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete message";
      toast.error(errorMsg);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.sender === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("newGroupMessage", (newMessage) => {
      if (selectedUser.members && newMessage.group === selectedUser._id) {
        set({
          messages: [...get().messages, newMessage],
        });
      }
    });

    socket.on("messageEdited", (updatedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === updatedMessage._id ? { ...msg, content: updatedMessage.content, isEdited: true } : msg
        ),
      });
    });

    socket.on("messageDeleted", (messageId) => {
      set({
        messages: get().messages.filter((msg) => msg._id !== messageId),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  updateGroup: async (groupId, updateData) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, updateData);
      if (res.data.success) {
        set((state) => ({
          groups: state.groups.map((group) =>
            group._id === groupId ? res.data.group : group
          ),
          selectedUser: state.selectedUser?._id === groupId ? res.data.group : state.selectedUser,
        }));
        return { success: true, data: res.data.group };
      } else {
        throw new Error(res.data.error || "Failed to update group");
      }
    } catch (error) {
      console.error("Error updating group:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Failed to update group");
    }
  },

  deleteGroup: async (groupId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}`);
      if (res.data.success) {
        set((state) => ({
          groups: state.groups.filter((group) => group._id !== groupId),
          selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
        }));
        return { success: true };
      } else {
        throw new Error(res.data.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || "Failed to delete group");
    }
  },
}));
