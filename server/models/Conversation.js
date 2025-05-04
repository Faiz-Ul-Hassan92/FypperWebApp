const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    // Array of 2 user IDs involved in the conversation
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // Optional: Reference to the last message for quick previews
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrivateChatMessage'
    },
    // Timestamp of the last message or interaction
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
        index: true // Index for sorting conversations
    }
}, { timestamps: true });

// Ensure participants array always has 2 unique users
ConversationSchema.path('participants').validate(function(value) {
    return Array.isArray(value) && value.length === 2 && value[0].toString() !== value[1].toString();
}, 'Conversation must have exactly two distinct participants.');

// Ensure unique conversations between the same two participants
// Sort participants before creating index to handle order difference
ConversationSchema.index({ participants: 1 }, { unique: true, partialFilterExpression: { participants: { $size: 2 } } });


module.exports = mongoose.model('Conversation', ConversationSchema); 