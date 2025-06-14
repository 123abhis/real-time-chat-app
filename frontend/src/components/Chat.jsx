import { useState, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { sendMessage } from '../lib/api';
import Message from './Message';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';

const Chat = () => {
    const { selectedUser, messages, sendMessage: sendMessageToStore } = useChatStore();
    const { authUser } = useAuthStore();
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [password, setPassword] = useState("");
    const { user } = useAuthContext();

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await sendMessage(
                selectedUser._id,
                newMessage,
                password ? password : null
            );

            if (response.success) {
                sendMessageToStore(response.data);
                setNewMessage('');
                setPassword('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(error.message || "Failed to send message");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="bg-gray-100 p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold">Chat</h2>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Users
                            </button>
                            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Groups
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message) => (
                    <div
                        key={message._id}
                        className="mb-4"
                    >
                        <Message 
                            message={message} 
                        />
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex flex-col gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full p-2 border rounded"
                        rows={3}
                    />
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={password ? true : false}
                                onChange={(e) => setPassword(e.target.checked ? "password" : "")}
                            />
                            <span>Encrypt message</span>
                        </label>
                        {password && (
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="flex-1 p-2 border rounded"
                            />
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat; 