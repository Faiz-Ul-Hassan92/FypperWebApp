const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true, // Index for faster querying by project
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000 // Add a reasonable max length
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Index sender if you need to query messages by sender frequently
// ChatMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema); 