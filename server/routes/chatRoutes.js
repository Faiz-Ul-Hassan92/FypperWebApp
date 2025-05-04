const express = require('express');
const {
  getChatMessages,
  postChatMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Get messages for a specific project
router.get('/:projectId', getChatMessages);

// Post a message to a specific project
router.post('/:projectId', postChatMessage);

module.exports = router; 