const Conversation = require('../models/Conversation');
const PrivateChatMessage = require('../models/PrivateChatMessage');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get list of conversations for the logged-in user
// @route   GET /api/private-chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const conversations = await Conversation.find({ participants: userId })
            .populate({
                path: 'participants',
                select: 'name email role' // Select fields for participants
            })
            .populate({
                path: 'lastMessage',
                select: 'content sender timestamp' // Select fields for last message preview
            })
            .sort({ lastUpdatedAt: -1 });

        // Filter out the logged-in user from the participant list for frontend display
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
            return {
                _id: conv._id,
                otherParticipant: otherParticipant || null, // Handle potential errors
                lastMessage: conv.lastMessage,
                lastUpdatedAt: conv.lastUpdatedAt,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt
            };
        });

        res.status(200).json({ success: true, data: formattedConversations });
    } catch (error) {
        console.error('Get Conversations Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching conversations' });
    }
};

// @desc    Get messages between logged-in user and another user
// @route   GET /api/private-chat/messages/:otherUserId
// @access  Private
exports.getMessages = async (req, res, next) => {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
         return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    try {
        // Find the conversation involving both users
        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        if (!conversation) {
            // No conversation exists yet, return empty array
            return res.status(200).json({ success: true, data: [] });
        }

        // Fetch messages for this conversation
        const messages = await PrivateChatMessage.find({ conversation: conversation._id })
            .populate('sender', 'name role') // Populate sender details
            .sort({ createdAt: 1 }); // Sort messages by creation time

        res.status(200).json({ success: true, data: messages });

    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching messages' });
    }
};

// @desc    Send a private message to another user
// @route   POST /api/private-chat/messages/:receiverId
// @access  Private
exports.sendMessage = async (req, res, next) => {
    const senderId = req.user.id;
    const { receiverId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ success: false, message: 'Invalid Receiver ID' });
    }
    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }
    if (senderId === receiverId) {
        return res.status(400).json({ success: false, message: 'Cannot send message to yourself' });
    }

    try {
        // Ensure receiver exists (optional, but good practice)
        const receiverExists = await User.findById(receiverId);
        if (!receiverExists) {
             return res.status(404).json({ success: false, message: 'Receiver user not found' });
        }

        // Find or create the conversation
        const participants = [senderId, receiverId].sort(); // Sort IDs for consistency
        let conversation = await Conversation.findOneAndUpdate(
            { participants: participants }, 
            { $set: { participants: participants }, $setOnInsert: { lastUpdatedAt: Date.now() } }, // Update lastUpdatedAt only on creation initially
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Create the new message
        let newMessage = await PrivateChatMessage.create({
            conversation: conversation._id,
            sender: senderId,
            receiver: receiverId,
            content: content.trim()
        });

        // Update the conversation's last message and timestamp
        conversation.lastMessage = newMessage._id;
        conversation.lastUpdatedAt = newMessage.createdAt; // Use message timestamp
        await conversation.save();

        // Populate sender info for the response
        newMessage = await newMessage.populate('sender', 'name role');

        res.status(201).json({ success: true, data: newMessage });

    } catch (error) {
        console.error('Send Message Error:', error);
         if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
         }
        res.status(500).json({ success: false, message: 'Server Error sending message' });
    }
}; 