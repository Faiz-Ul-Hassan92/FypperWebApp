const express = require('express');
const {
    getConversations,
    getMessages,
    sendMessage
} = require('../controllers/privateChatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All private chat routes require authentication
router.use(protect);

// Get all conversations for the logged-in user
router.get('/conversations', getConversations);

// Get messages with a specific user
router.get('/messages/:otherUserId', getMessages);

// Send a message to a specific user
router.post('/messages/:receiverId', sendMessage);

module.exports = router; 