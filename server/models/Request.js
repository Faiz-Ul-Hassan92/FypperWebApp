const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    required: true,
    enum: ['join_project', 'request_supervisor', 'request_recruiter'],
  },
  fromUser: {
    // User making the request (Student)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUser: {
    // User receiving the request (Project Owner, Supervisor, Recruiter)
    // For 'join_project', this could be the project owner.
    // For others, the specific supervisor or recruiter.
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    // Project the request is related to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  message: {
    // Optional message from the requester
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field on update
RequestSchema.pre('save', function(next){
    this.updatedAt = Date.now();
    next();
});

// Consider adding indexes for faster querying, e.g., on status, toUser, project
// RequestSchema.index({ toUser: 1, status: 1 });
// RequestSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Request', RequestSchema); 