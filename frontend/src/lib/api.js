import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

// Message API functions
export const sendMessage = async (receiver, content, password) => {
    const response = await axios.post(`${API_URL}/messages/send`, {
        receiver,
        content,
        password
    });
    return response.data;
};

export const editMessage = async (messageId, content) => {
    const response = await axios.put(`${API_URL}/messages/edit`, {
        messageId,
        content
    });
    return response.data;
};

export const deleteMessage = async (messageId) => {
    const response = await axios.delete(`${API_URL}/messages/${messageId}`);
    return response.data;
};

export const decryptMessage = async (messageId, password) => {
    const response = await axios.post(`${API_URL}/messages/decrypt`, {
        messageId,
        password
    });
    return response.data;
};

// User API functions
export const updateProfilePicture = async (image) => {
    const response = await axios.put(`${API_URL}/users/profile/picture`, {
        image
    });
    return response.data;
};

export const getUserProfile = async () => {
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data;
}; 