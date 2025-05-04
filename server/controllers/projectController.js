const Project = require('../models/Project');
const User = require('../models/User');
const Request = require('../models/Request'); // Import Request model

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Student)
exports.createProject = async (req, res, next) => {
  const { title, description, requiredSkills, maxMembers } = req.body;
  const ownerId = req.user.id; // From protect middleware

  try {
    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide title and description' });
    }

    // Cap maxMembers at 3
    const cappedMaxMembers = maxMembers ? Math.min(parseInt(maxMembers, 10), 3) : 3;

    const project = await Project.create({
      title,
      description,
      requiredSkills,
      maxMembers: cappedMaxMembers,
      owner: ownerId,
      members: [ownerId] // Add owner as the first member
    });

    // Add project to owner's ownedProjects list
    await User.findByIdAndUpdate(ownerId, { $push: { ownedProjects: project._id, enrolledProjects: project._id } });

    res.status(201).json({ success: true, data: project });

  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ success: false, message: 'Server Error creating project' });
    // next(error);
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    // Add filtering/pagination later if needed
    const projects = await Project.find()
        .populate('owner', 'name email') // Populate owner name and email
        .populate('members', 'name email') // Populate members
        .populate('supervisor', 'name email') // Populate supervisor
        .populate('recruiterCollaboration.recruiter', 'name email company'); // Populate recruiter

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching projects' });
    // next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
        .populate('owner', 'name email')
        .populate('members', 'name email skills') // Maybe include skills of members
        .populate('supervisor', 'name email expertise')
        .populate('recruiterCollaboration.recruiter', 'name email company');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Get Project By ID Error:', error);
    // Handle CastError if ID format is invalid
    if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Project not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error fetching project' });
    // next(error);
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Project Owner)
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if the logged-in user is the owner of the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'User not authorized to update this project' });
    }

    // Prevent changing owner or members directly via this route for safety
    // Use dedicated routes/controllers for member management
    const { owner, members, ...updateData } = req.body;

    project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true, // Return the modified document
      runValidators: true // Run schema validators
    });

    res.status(200).json({ success: true, data: project });

  } catch (error) {
    console.error('Update Project Error:', error);
    if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Project not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error updating project' });
    // next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Project Owner or Admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Authorization Check
    if (project.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'User not authorized to delete this project' });
    }

    const projectId = project._id;

    // --- Cleanup Logic --- 

    // 1. Remove project references from all users (owner, members, supervisor, recruiter)
    await User.updateMany(
        { $or: [ 
            { ownedProjects: projectId }, 
            { enrolledProjects: projectId }, 
            { supervisedProjects: projectId }, 
            { collaboratingProjects: projectId } 
          ] 
        },
        { $pull: { 
            ownedProjects: projectId, 
            enrolledProjects: projectId, 
            supervisedProjects: projectId,
            collaboratingProjects: projectId 
          } 
        }
    );

    // 2. Delete all requests associated with this project
    await Request.deleteMany({ project: projectId });

    // 3. Delete the project itself
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({ success: true, message: "Project deleted successfully", data: {} });

  } catch (error) {
    console.error('Delete Project Error:', error);
     if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Project not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error deleting project' });
    // next(error);
  }
};

// @desc    Remove a member from a project
// @route   DELETE /api/projects/:projectId/members/:memberId
// @access  Private (Project Owner)
exports.removeMember = async (req, res, next) => {
    const { projectId, memberId } = req.params;
    const ownerId = req.user.id;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Authorization: Only owner can remove members
        if (project.owner.toString() !== ownerId) {
            return res.status(403).json({ success: false, message: 'User not authorized to modify this project' });
        }

        // Cannot remove the owner
        if (memberId === ownerId) {
            return res.status(400).json({ success: false, message: 'Cannot remove the project owner' });
        }

        // Check if the member exists in the project
        const memberIndex = project.members.findIndex(m => m.toString() === memberId);
        if (memberIndex === -1) {
            return res.status(404).json({ success: false, message: 'Member not found in this project' });
        }

        // Remove member from project's members array
        project.members.pull(memberId);
        await project.save();

        // Remove project from the removed user's enrolledProjects
        await User.findByIdAndUpdate(memberId, { $pull: { enrolledProjects: projectId } });

        // Populate data for the response
        const updatedProject = await Project.findById(projectId)
            .populate('owner', 'name email')
            .populate('members', 'name email')
            .populate('supervisor', 'name email')
            .populate('recruiterCollaboration.recruiter', 'name email company');

        res.status(200).json({ success: true, message: 'Member removed successfully', data: updatedProject });

    } catch (error) {
        console.error('Remove Member Error:', error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Project or Member ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error removing member' });
    }
};

// @desc    Remove the supervisor from a project
// @route   DELETE /api/projects/:projectId/supervisor
// @access  Private (Project Owner)
exports.removeSupervisor = async (req, res, next) => {
    const { projectId } = req.params;
    const ownerId = req.user.id;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Authorization: Only owner can remove supervisor
        if (project.owner.toString() !== ownerId) {
            return res.status(403).json({ success: false, message: 'User not authorized to modify this project' });
        }

        const supervisorId = project.supervisor;
        if (!supervisorId) {
            return res.status(400).json({ success: false, message: 'No supervisor assigned to this project' });
        }

        // Remove supervisor from project
        project.supervisor = undefined; // Or null
        await project.save();

        // Remove project from the removed supervisor's supervisedProjects
        await User.findByIdAndUpdate(supervisorId, { $pull: { supervisedProjects: projectId } });

        // Populate data for the response
         const updatedProject = await Project.findById(projectId)
            .populate('owner', 'name email')
            .populate('members', 'name email')
            .populate('supervisor', 'name email')
            .populate('recruiterCollaboration.recruiter', 'name email company');

        res.status(200).json({ success: true, message: 'Supervisor removed successfully', data: updatedProject });

    } catch (error) {
        console.error('Remove Supervisor Error:', error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Project ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error removing supervisor' });
    }
};

// @desc    Remove the recruiter collaboration from a project
// @route   DELETE /api/projects/:projectId/recruiter
// @access  Private (Project Owner)
exports.removeRecruiter = async (req, res, next) => {
    const { projectId } = req.params;
    const ownerId = req.user.id;

    try {
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Authorization: Only owner can remove recruiter collaboration
        if (project.owner.toString() !== ownerId) {
            return res.status(403).json({ success: false, message: 'User not authorized to modify this project' });
        }

        const recruiterCollab = project.recruiterCollaboration;
        if (!recruiterCollab || !recruiterCollab.recruiter) {
            return res.status(400).json({ success: false, message: 'No recruiter collaboration found for this project' });
        }
        const recruiterId = recruiterCollab.recruiter;

        // Remove recruiter collaboration from project
        project.recruiterCollaboration = undefined; // Or null, or set status to something like 'removed'
        await project.save();

        // Remove project from the removed recruiter's collaboratingProjects
        if (recruiterId) {
            await User.findByIdAndUpdate(recruiterId, { $pull: { collaboratingProjects: projectId } });
        }

        // Populate data for the response
        const updatedProject = await Project.findById(projectId)
            .populate('owner', 'name email')
            .populate('members', 'name email')
            .populate('supervisor', 'name email')
            .populate('recruiterCollaboration.recruiter', 'name email company');

        res.status(200).json({ success: true, message: 'Recruiter collaboration removed successfully', data: updatedProject });

    } catch (error) {
        console.error('Remove Recruiter Error:', error);
         if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: 'Invalid Project ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error removing recruiter collaboration' });
    }
};

// Placeholder functions for future implementation (if needed)
// exports.addMemberToProject = async (req, res, next) => { ... };
// exports.removeMemberFromProject = async (req, res, next) => { ... }; 