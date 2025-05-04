const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// Helper function to check if user is member, supervisor, or approved recruiter
const checkProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return false;
    const isMember = project.members.some(memberId => memberId.equals(userId));
    const isSupervisor = project.supervisor && project.supervisor.equals(userId);
    const isApprovedRecruiter = 
        project.recruiterCollaboration?.recruiter?.equals(userId) && 
        project.recruiterCollaboration?.status === 'approved';
    return isMember || isSupervisor || isApprovedRecruiter;
};

// @desc    Get chat messages for a project
// @route   GET /api/chat/:projectId
// @access  Private (Project Members, Supervisor, Approved Recruiter)
exports.getChatMessages = async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
         return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }

    try {
        // Authorization check using the updated helper
        const hasAccess = await checkProjectAccess(projectId, userId);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'User not authorized to view this chat' });
        }

        const messages = await ChatMessage.find({ project: projectId })
            .populate('sender', 'name role') // Populate sender's name and role
            .sort({ timestamp: 1 }); // Sort by oldest first

        res.status(200).json({ success: true, count: messages.length, data: messages });

    } catch (error) {
        console.error('Get Chat Messages Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching messages' });
        // next(error);
    }
};

// @desc    Post a new chat message to a project
// @route   POST /api/chat/:projectId
// @access  Private (Project Members, Supervisor, Approved Recruiter)
exports.postChatMessage = async (req, res, next) => {
    const { projectId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
         return res.status(400).json({ success: false, message: 'Invalid Project ID' });
    }
    if (!content || content.trim() === '') {
         return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    try {
         // Authorization check using the updated helper
        const hasAccess = await checkProjectAccess(projectId, senderId);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'User not authorized to post in this chat' });
        }

        let newMessage = await ChatMessage.create({
            project: projectId,
            sender: senderId,
            content: content.trim()
        });

        // Populate sender info for the response
        newMessage = await newMessage.populate('sender', 'name role');

        res.status(201).json({ success: true, data: newMessage });

    } catch (error) {
         console.error('Post Chat Message Error:', error);
         // Handle potential validation errors (e.g., maxlength)
         if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
         }
         res.status(500).json({ success: false, message: 'Server Error posting message' });
         // next(error);
    }
}; 