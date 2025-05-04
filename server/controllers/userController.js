const User = require('../models/User');
const Project = require('../models/Project'); // Import Project model
const Request = require('../models/Request'); // Import Request model
const ChatMessage = require('../models/ChatMessage'); // Import ChatMessage model

// @desc    Get all users (Admin view)
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    
    // If role is specified, filter by role
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password') // Exclude passwords
      .sort({ name: 1 }); // Sort by name

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching users' });
  }
};

// @desc    Get users by role: supervisor
// @route   GET /api/users/supervisors
// @access  Private
exports.getSupervisors = async (req, res, next) => {
   try {
    // Find users with the role 'supervisor', select relevant fields
    const supervisors = await User.find({ role: 'supervisor' })
                                  .select('name email expertise'); // Select fields useful for selection
    res.status(200).json({ success: true, count: supervisors.length, data: supervisors });
  } catch (error) {
    console.error('Get Supervisors Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching supervisors' });
    // next(error);
  }
};

// @desc    Get users by role: recruiter
// @route   GET /api/users/recruiters
// @access  Private
exports.getRecruiters = async (req, res, next) => {
   try {
    // Find users with the role 'recruiter', select relevant fields
    const recruiters = await User.find({ role: 'recruiter' })
                                 .select('name email company interestedTechnologies'); // Select fields useful for selection
    res.status(200).json({ success: true, count: recruiters.length, data: recruiters });
  } catch (error) {
    console.error('Get Recruiters Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching recruiters' });
    // next(error);
  }
};


// @desc    Get single user by ID (Admin view)
// @route   GET /api/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res, next) => {
  // This remains admin-only
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get User By ID Error:', error);
     if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'User not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error fetching user' });
    // next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  const userIdToDelete = req.params.id;
  const adminUserId = req.user.id; // ID of the admin performing the action

  try {
    const userToDelete = await User.findById(userIdToDelete);

    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (userIdToDelete === adminUserId) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete themselves' });
    }

        // Prevent deleting the last admin
        if (userToDelete.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ success: false, message: 'Cannot delete the last admin user' });
            }
    }

    // --- Cleanup Logic --- 

    // 1. Handle Projects Owned by the User (Delete them for simplicity)
    const ownedProjectIds = userToDelete.ownedProjects || [];
    if (ownedProjectIds.length > 0) {
        console.log(`Deleting ${ownedProjectIds.length} projects owned by user ${userIdToDelete}...`);
        for (const projectId of ownedProjectIds) {
            const project = await Project.findById(projectId);
            if (project) {
                // Remove refs from other users
                await User.updateMany(
                    { _id: { $ne: userIdToDelete }, $or: [{ enrolledProjects: projectId }, { supervisedProjects: projectId }, { collaboratingProjects: projectId }] },
                    { $pull: { enrolledProjects: projectId, supervisedProjects: projectId, collaboratingProjects: projectId } }
                );
                // Delete associated requests
                await Request.deleteMany({ project: projectId });
                // Delete the project
                await Project.findByIdAndDelete(projectId);
            }
        }
    }

    // 2. Remove User from Member Lists of Other Projects
    await Project.updateMany(
        { members: userIdToDelete },
        { $pull: { members: userIdToDelete } }
    );

    // 3. Remove User as Supervisor from Projects
    await Project.updateMany(
        { supervisor: userIdToDelete },
        { $set: { supervisor: null } } 
    );

    // 4. Remove User as Recruiter from Projects
    await Project.updateMany(
        { 'recruiterCollaboration.recruiter': userIdToDelete },
        { $set: { 'recruiterCollaboration.status': 'none', 'recruiterCollaboration.recruiter': null } }
    );

    // 5. Delete Requests Sent BY or TO the User
    await Request.deleteMany({ $or: [{ fromUser: userIdToDelete }, { toUser: userIdToDelete }] });

        // 6. Delete Chat Messages
        await ChatMessage.deleteMany({ 
            $or: [
                { sender: userIdToDelete },
                { receiver: userIdToDelete }
            ]
        });

        // 7. Delete the User themselves
    await User.findByIdAndDelete(userIdToDelete);

    res.status(200).json({ success: true, message: "User deleted successfully", data: {} });

  } catch (error) {
    console.error('Delete User Error:', error);
    if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'User not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error deleting user' });
  }
};

// @desc    Search users by name
// @route   GET /api/users/search?q=<query>
// @access  Private
exports.searchUsers = async (req, res, next) => {
    const query = req.query.q || '';
    const currentUserId = req.user.id;

    if (!query.trim()) {
        return res.status(200).json({ success: true, data: [] }); // Return empty if no query
    }

    try {
        // Case-insensitive regex search on the 'name' field
        // Exclude the current user from the search results
        const users = await User.find({
            name: { $regex: query, $options: 'i' },
            _id: { $ne: currentUserId } // Don't include self
        }).select('name email role'); // Select fields to return

        res.status(200).json({ success: true, data: users });

    } catch (error) {
        console.error('Search Users Error:', error);
        res.status(500).json({ success: false, message: 'Server Error searching users' });
    }
};

// @desc    Update user skills
// @route   PUT /api/users/skills
// @access  Private
exports.updateUserSkills = async (req, res, next) => {
    try {
        const { skills } = req.body;

        // Validate skills is an array
        if (!Array.isArray(skills)) {
            return res.status(400).json({ success: false, message: 'Skills must be an array' });
        }

        // Update the user's skills
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { skills },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Update User Skills Error:', error);
        res.status(500).json({ success: false, message: 'Server Error updating skills' });
    }
}; 