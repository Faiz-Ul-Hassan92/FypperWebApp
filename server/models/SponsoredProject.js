const mongoose = require('mongoose');

const sponsoredProjectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title for the project'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description for the project'],
        trim: true
    },
    financingDetails: {
        type: String,
        required: [true, 'Please provide financing details'],
        trim: true
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SponsoredProject', sponsoredProjectSchema); 