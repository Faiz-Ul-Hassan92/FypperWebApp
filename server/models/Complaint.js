const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrivateChatMessage',
        required: true
    },
    senderEmail: {
        type: String,
        required: true
    },
    complainerEmail: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    messageContent: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', ComplaintSchema); 