import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users and their status
const userSocketMap = {}; // {userId: socketId}
const userStatusMap = {}; // {userId: status}
const typingUsers = new Set(); // Set of users who are currently typing

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    userStatusMap[userId] = 'online';
    
    // Emit updated online users list to all clients
    const onlineUsersList = Object.keys(userSocketMap).map(id => ({
      userId: id,
      status: userStatusMap[id]
    }));
    console.log("Emitting online users:", onlineUsersList);
    io.emit("getOnlineUsers", onlineUsersList);
  }

  // Handle user status changes
  socket.on("updateStatus", ({ status }) => {
    const currentUserId = socket.handshake.query.userId;
    if (currentUserId) {
      userStatusMap[currentUserId] = status;
      io.emit("userStatusChanged", { userId: currentUserId, status });
      
      // Also emit updated online users list
      const onlineUsersList = Object.keys(userSocketMap).map(id => ({
        userId: id,
        status: userStatusMap[id]
      }));
      console.log("Emitting updated online users:", onlineUsersList);
      io.emit("getOnlineUsers", onlineUsersList);
    }
  });

  // Handle typing indicators
  socket.on("typing", ({ receiverId }) => {
    if (userId) {
      typingUsers.add(userId);
      io.to(userSocketMap[receiverId]).emit("userTyping", { userId });
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    if (userId) {
      typingUsers.delete(userId);
      io.to(userSocketMap[receiverId]).emit("userStoppedTyping", { userId });
    }
  });

  // Handle message reactions
  socket.on("messageReaction", ({ messageId, reaction, receiverId }) => {
    if (userId) {
      io.to(userSocketMap[receiverId]).emit("newReaction", {
        messageId,
        reaction,
        userId
      });
    }
  });

  // Handle read receipts
  socket.on("messageRead", ({ messageId, receiverId }) => {
    if (userId) {
      io.to(userSocketMap[receiverId]).emit("messageReadBy", {
        messageId,
        userId
      });
    }
  });

  // Handle group chat events
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
  });

  socket.on("groupMessage", ({ groupId, message }) => {
    io.to(groupId).emit("newGroupMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    const currentUserId = socket.handshake.query.userId;
    if (currentUserId) {
      delete userSocketMap[currentUserId];
      userStatusMap[currentUserId] = 'offline';
      
      // Emit both status change and updated online users list
      io.emit("userStatusChanged", { userId: currentUserId, status: 'offline' });
      const onlineUsersList = Object.keys(userSocketMap).map(id => ({
        userId: id,
        status: userStatusMap[id]
      }));
      console.log("Emitting final online users:", onlineUsersList);
      io.emit("getOnlineUsers", onlineUsersList);
    }
  });
});

export { io, app, server };
