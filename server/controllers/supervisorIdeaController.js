const SupervisorIdea = require('../models/SupervisorIdea');
const mongoose = require('mongoose');

// @desc    Get all ideas for a supervisor
// @route   GET /api/supervisor/ideas
// @access  Private (Supervisor)
exports.getSupervisorIdeas = async (req, res, next) => {
    try {
        const ideas = await SupervisorIdea.find({ supervisor: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: ideas.length, data: ideas });
    } catch (error) {
        console.error('Get Supervisor Ideas Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching ideas' });
    }
};

// @desc    Create a new idea
// @route   POST /api/supervisor/ideas
// @access  Private (Supervisor)
exports.createSupervisorIdea = async (req, res, next) => {
    try {
        const { title, description } = req.body;

        // Basic validation
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Please provide title and description' });
        }

        const idea = await SupervisorIdea.create({
            title,
            description,
            supervisor: req.user.id
        });

        res.status(201).json({ success: true, data: idea });
    } catch (error) {
        console.error('Create Supervisor Idea Error:', error);
        res.status(500).json({ success: false, message: 'Server Error creating idea' });
    }
};

// @desc    Delete an idea
// @route   DELETE /api/supervisor/ideas/:id
// @access  Private (Supervisor)
exports.deleteSupervisorIdea = async (req, res, next) => {
    try {
        const idea = await SupervisorIdea.findById(req.params.id);

        if (!idea) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }

        // Make sure the idea belongs to the supervisor
        if (idea.supervisor.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this idea' });
        }

        await idea.remove();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('Delete Supervisor Idea Error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid idea ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error deleting idea' });
    }
};

// @desc    Get ideas for a specific supervisor
// @route   GET /api/supervisor/:supervisorId/ideas
// @access  Private
exports.getSupervisorIdeasById = async (req, res, next) => {
    try {
        const { supervisorId } = req.params;
        
        // Validate supervisorId format
        if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
            return res.status(400).json({ success: false, message: 'Invalid supervisor ID format' });
        }

        const ideas = await SupervisorIdea.find({ supervisor: supervisorId })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: ideas.length, data: ideas });
    } catch (error) {
        console.error('Get Supervisor Ideas By ID Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching ideas' });
    }
}; 