const SponsoredProject = require('../models/SponsoredProject');
const mongoose = require('mongoose');

// @desc    Get all sponsored projects for a recruiter
// @route   GET /api/recruiter/projects
// @access  Private (Recruiter)
exports.getSponsoredProjects = async (req, res, next) => {
    try {
        const projects = await SponsoredProject.find({ recruiter: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (error) {
        console.error('Get Sponsored Projects Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching projects' });
    }
};

// @desc    Create a new sponsored project
// @route   POST /api/recruiter/projects
// @access  Private (Recruiter)
exports.createSponsoredProject = async (req, res, next) => {
    try {
        const { title, description, financingDetails } = req.body;

        // Basic validation
        if (!title || !description || !financingDetails) {
            return res.status(400).json({ success: false, message: 'Please provide title, description, and financing details' });
        }

        const project = await SponsoredProject.create({
            title,
            description,
            financingDetails,
            recruiter: req.user.id
        });

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error('Create Sponsored Project Error:', error);
        res.status(500).json({ success: false, message: 'Server Error creating project' });
    }
};

// @desc    Delete a sponsored project
// @route   DELETE /api/recruiter/projects/:id
// @access  Private (Recruiter)
exports.deleteSponsoredProject = async (req, res, next) => {
    try {
        const project = await SponsoredProject.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Make sure the project belongs to the recruiter
        if (project.recruiter.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
        }

        await project.remove();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        console.error('Delete Sponsored Project Error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid project ID format' });
        }
        res.status(500).json({ success: false, message: 'Server Error deleting project' });
    }
};

// @desc    Get sponsored projects for a specific recruiter
// @route   GET /api/recruiter/:recruiterId/projects
// @access  Private
exports.getRecruiterProjectsById = async (req, res, next) => {
    try {
        const { recruiterId } = req.params;
        
        // Validate recruiterId format
        if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
            return res.status(400).json({ success: false, message: 'Invalid recruiter ID format' });
        }

        const projects = await SponsoredProject.find({ recruiter: recruiterId })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (error) {
        console.error('Get Recruiter Projects By ID Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching projects' });
    }
}; 