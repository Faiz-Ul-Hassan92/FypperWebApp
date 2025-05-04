const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  requiredSkills: [String], // Skills needed for the project
  maxMembers: {
    type: Number,
    default: 5, // Default max members
  },
  owner: {
    // Student who created the project
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    // Students currently in the group
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  recruiterCollaboration: {
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    }
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'completed'], // Project status
    default: 'open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure owner is added to members list on creation (can be done in controller logic too)
// ProjectSchema.pre('save', function(next) {
//   if (this.isNew && !this.members.includes(this.owner)) {
//     this.members.push(this.owner);
//   }
//   next();
// });

module.exports = mongoose.model('Project', ProjectSchema); 