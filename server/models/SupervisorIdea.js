const mongoose = require('mongoose');

const supervisorIdeaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the idea'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description for the idea'],
        trim: true
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SupervisorIdea', supervisorIdeaSchema); 