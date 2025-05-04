const mongoose = require('mongoose');

const PrivateChatMessageSchema = new mongoose.Schema({
    // Identifies the conversation this message belongs to
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Conversation',
        index: true
    },
    // Array of exactly 2 participants (for easier querying? Or rely on conversation?)
    // Let's rely on conversation for simplicity, maybe add sender/receiver
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: [true, 'Message content cannot be empty'],
        trim: true,
        maxlength: [2000, 'Message content cannot exceed 2000 characters']
    },
    // Optional: Track if the message has been read by the receiver
    // read: {
    //     type: Boolean,
    //     default: false
    // }
}, { timestamps: true });

module.exports = mongoose.model('PrivateChatMessage', PrivateChatMessageSchema); 