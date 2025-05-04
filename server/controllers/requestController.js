const Request = require('../models/Request');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new request (join, supervisor, recruiter)
// @route   POST /api/requests
// @access  Private (Student)
exports.createRequest = async (req, res, next) => {
  const { requestType, toUserId, projectId, message } = req.body;
  const fromUserId = req.user.id;

  try {
    // --- Basic Validation --- 
    if (!requestType || !toUserId || !projectId) {
      return res.status(400).json({ success: false, message: 'Missing required request fields' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(toUserId) || !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: 'Invalid user or project ID format' });
    }

    // --- Check Existence --- 
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    // --- Specific Request Type Logic --- 
    let targetUserId = null;

    if (requestType === 'join_project') {
      // Request goes to the project owner
      targetUserId = project.owner;
      if (project.members.includes(fromUserId)) {
        return res.status(400).json({ success: false, message: 'You are already a member of this project' });
      }
       if (project.members.length >= project.maxMembers) {
        return res.status(400).json({ success: false, message: 'Project group is already full' });
      }
      // Ensure toUserId provided in body matches project owner for clarity/security
      if (toUserId.toString() !== project.owner.toString()) {
        return res.status(400).json({ success: false, message: 'Request must be sent to the project owner' });
      }

    } else if (requestType === 'request_supervisor') {
      // Request goes to the supervisor
      if (toUser.role !== 'supervisor') {
        return res.status(400).json({ success: false, message: 'Target user is not a supervisor' });
      }
      if (project.supervisor) {
          return res.status(400).json({ success: false, message: 'Project already has a supervisor' });
      }
      targetUserId = toUserId;

    } else if (requestType === 'request_recruiter') {
      // Request goes to the recruiter
      if (toUser.role !== 'recruiter') {
        return res.status(400).json({ success: false, message: 'Target user is not a recruiter' });
      }
       if (project.recruiterCollaboration && project.recruiterCollaboration.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Project already has an approved recruiter collaboration' });
       }
      targetUserId = toUserId;

    } else {
      return res.status(400).json({ success: false, message: 'Invalid request type' });
    }

    // Check if a similar pending request already exists
    const existingRequest = await Request.findOne({
        requestType,
        fromUser: fromUserId,
        project: projectId,
        toUser: targetUserId,
        status: 'pending'
    });

    if (existingRequest) {
        return res.status(400).json({ success: false, message: 'A pending request of this type already exists' });
    }

    // Create the request
    const request = await Request.create({
      requestType,
      fromUser: fromUserId,
      toUser: targetUserId, // Use the determined target user ID
      project: projectId,
      message,
    });

    res.status(201).json({ success: true, data: request });

  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({ success: false, message: 'Server Error creating request' });
    // next(error);
  }
};

const checkProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    const isMember = project.members.some(memberId => memberId.equals(userId));
    const isSupervisor = project.supervisor && project.supervisor.equals(userId);
    return isMember || isSupervisor;
};

// @desc    Get requests (filtered based on user role and context)
// @route   GET /api/requests
// @access  Private
exports.getRequests = async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        let query = {};
        let combinedRequests = [];

        if (userRole === 'student') {
            // 1. Fetch student's outgoing requests
            const outgoingRequests = await Request.find({ fromUser: userId })
                .populate('fromUser', 'name email skills')
                .populate('toUser', 'name email')
                .populate({ 
                    path: 'project', 
                    select: 'title description owner', 
                    populate: { path: 'owner', select: 'name email' } // Populate owner within project
                })
                .sort({ createdAt: -1 });
            combinedRequests = outgoingRequests;

            // 2. Fetch projects the student is a member of
            const memberProjects = await Project.find({ members: userId }).select('_id owner'); // Select only needed fields
            const memberProjectIds = memberProjects.map(p => p._id);
            
            if (memberProjectIds.length > 0) {
                // 3. Fetch pending join requests TO the owners of projects the student is a member of
                const projectOwners = memberProjects.map(p => p.owner);
                const incomingJoinRequests = await Request.find({
                        project: { $in: memberProjectIds },
                        requestType: 'join_project',
                        status: 'pending',
                        // Ensure we don't fetch requests sent *by* the current student again
                        fromUser: { $ne: userId }
                        // Optimization: Optionally filter by 'toUser: { $in: projectOwners }' if needed, but project filter might be sufficient
                    })
                    .populate('fromUser', 'name email skills')
                    .populate('toUser', 'name email') // Should be the owner
                    .populate({ 
                        path: 'project', 
                        select: 'title description owner', 
                        populate: { path: 'owner', select: 'name email' }
                    })
                    .sort({ createdAt: -1 });

                // Add these requests to the combined list if they aren't already there (e.g., if also fetched as outgoing)
                // A simple check based on ID should suffice for now
                const outgoingRequestIds = new Set(outgoingRequests.map(r => r._id.toString()));
                incomingJoinRequests.forEach(req => {
                    if (!outgoingRequestIds.has(req._id.toString())) {
                        combinedRequests.push(req);
                    }
                });
                 // Sort the combined list again if necessary, or handle sorting client-side
                 combinedRequests.sort((a, b) => b.createdAt - a.createdAt); 
            }

        } else {
            // Supervisors, Recruiters, and Admins (acting as owners) see incoming requests TO them
            query = { toUser: userId, status: 'pending' };
            // Fetch requests based on the query
            const incomingRequests = await Request.find(query)
                .populate('fromUser', 'name email skills')
                .populate('toUser', 'name email')
                .populate({ 
                    path: 'project', 
                    select: 'title description owner', 
                    populate: { path: 'owner', select: 'name email' }
                })
                .sort({ createdAt: -1 });
            combinedRequests = incomingRequests;    
        }

        res.status(200).json({ success: true, count: combinedRequests.length, data: combinedRequests });

    } catch (error) {
        console.error('Get Requests Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching requests' });
        // next(error);
    }
};

// @desc    Get single request by ID
// @route   GET /api/requests/:id
// @access  Private (User involved in the request)
exports.getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('fromUser', 'name email skills')
      .populate('toUser', 'name email')
      .populate({ 
            path: 'project', 
            select: 'title description owner', 
            populate: { path: 'owner', select: 'name email' }
        });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Authorization: Ensure the logged-in user is either the sender or receiver OR a member/supervisor for join requests
    let hasAccess = false;
    if (request.fromUser?._id.toString() === req.user.id || request.toUser?._id.toString() === req.user.id) {
        hasAccess = true;
    }
    // Allow members/supervisors to view details of join requests for their projects
    if (!hasAccess && request.requestType === 'join_project') {
         hasAccess = await checkProjectAccess(request.project._id, req.user.id);
    }

    if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'User not authorized to view this request' });
    }

    res.status(200).json({ success: true, data: request });

  } catch (error) {
    console.error('Get Request By ID Error:', error);
     if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Request not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error fetching request' });
    // next(error);
  }
};

// @desc    Update request status (approve/reject)
// @route   PUT /api/requests/:id/status
// @access  Private (User request is TO)
exports.updateRequestStatus = async (req, res, next) => {
  const { status } = req.body; // Expecting 'approved' or 'rejected'
  const requestId = req.params.id;
  const userId = req.user.id; // ID of user performing the action

  try {
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const request = await Request.findById(requestId).populate('project', 'owner'); // Populate project owner

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Authorization: Ensure the logged-in user is the one the request was sent TO
    // For join_project requests, toUser is the project owner.
    // For supervisor/recruiter requests, toUser is the specific supervisor/recruiter.
    if (request.toUser?.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'User not authorized to update this request status' });
    }

    // Ensure request is still pending
    if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: `Request has already been ${request.status}` });
    }

    // --- Perform Actions Based on Approval/Rejection --- 
    let updatedProject = null;
    let requestingUserUpdates = {};
    let projectUpdates = {};

    if (status === 'approved') {
      // Refetch project for validation checks
      const project = await Project.findById(request.project?._id);
      if (!project) {
          return res.status(404).json({ success: false, message: 'Associated project not found' });
      }

      switch (request.requestType) {
        case 'join_project':
          // Validation: Check again if group is full before adding
          if (project.members.length >= project.maxMembers) {
              return res.status(400).json({ success: false, message: 'Cannot approve, project group is full' });
          }
          // Add user to project members
          if (!project.members.includes(request.fromUser)) {
              projectUpdates = { $addToSet: { members: request.fromUser } };
              requestingUserUpdates = { $addToSet: { enrolledProjects: request.project._id } };
          }
          break;
        case 'request_supervisor':
          // Validation: Check again if project already has supervisor
          if (project.supervisor) {
              return res.status(400).json({ success: false, message: 'Cannot approve, project already has a supervisor' });
          }
          projectUpdates = { supervisor: request.toUser };
          await User.findByIdAndUpdate(request.toUser, { $addToSet: { supervisedProjects: request.project._id } });
          break;
        case 'request_recruiter':
           // Validation: Check again
           if (project.recruiterCollaboration && project.recruiterCollaboration.status === 'approved') {
                return res.status(400).json({ success: false, message: 'Cannot approve, project already has an approved recruiter collaboration' });
           }
          projectUpdates = { recruiterCollaboration: { status: 'approved', recruiter: request.toUser } };
          await User.findByIdAndUpdate(request.toUser, { $addToSet: { collaboratingProjects: request.project._id } });
          break;
      }

      // Apply project updates if any
      if (Object.keys(projectUpdates).length > 0) {
        updatedProject = await Project.findByIdAndUpdate(request.project._id, projectUpdates, { new: true });
      }
      // Apply requesting user updates if any
      if (Object.keys(requestingUserUpdates).length > 0) {
        await User.findByIdAndUpdate(request.fromUser, requestingUserUpdates);
      }
    }

    // Update the request status itself
    request.status = status;
    request.updatedAt = Date.now();
    const updatedRequest = await request.save();

    // Populate necessary fields for response consistency
    const populatedRequest = await Request.findById(updatedRequest._id)
        .populate('fromUser', 'name email skills')
        .populate('toUser', 'name email')
        .populate({ path: 'project', select: 'title owner', populate: { path: 'owner', select: 'name email' } });

    res.status(200).json({ success: true, data: populatedRequest, updatedProject });

  } catch (error) {
    console.error('Update Request Status Error:', error);
    if (error.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Request not found with that ID' });
    }
    res.status(500).json({ success: false, message: 'Server Error updating request status' });
    // next(error);
  }
}; 