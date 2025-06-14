import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    sendMessage,
    editMessage,
    deleteMessage,
    decryptMessageController,
    getUsersForSidebar,
    getMessages,
    sendGroupMessage
} from '../controllers/message.controller.js';
import { translateMessage } from '../controllers/translation.controller.js';

const router = express.Router();

// Get users for sidebar
router.get('/users', protectRoute, getUsersForSidebar);

// Get messages
router.get('/:id', protectRoute, getMessages);

// Send message
router.post('/send', protectRoute, sendMessage);

// Send group message
router.post('/group/:groupId', protectRoute, sendGroupMessage);

// Edit message
router.put('/edit', protectRoute, editMessage);

// Delete message
router.delete('/:messageId', protectRoute, deleteMessage);

// Decrypt message
router.post('/decrypt', protectRoute, decryptMessageController);

// Translate message
router.post('/translate', protectRoute, translateMessage);

export default router; 