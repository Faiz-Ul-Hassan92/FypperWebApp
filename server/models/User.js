const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    // Add email validation if desired (e.g., using validator package)
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // Enforce minimum password length
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'supervisor', 'recruiter', 'admin'],
    default: 'student',
  },
  // Student specific fields
  skills: [String], // Array of skills
  enrolledProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  ownedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  // Supervisor specific fields
  expertise: [String], // Areas of expertise
  supervisedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  // Recruiter specific fields
  company: String,
  interestedTechnologies: [String],
  collaboratingProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Password Hashing Middleware
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 