const Complaint = require('../models/Complaint');
const PrivateChatMessage = require('../models/PrivateChatMessage');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private
exports.createComplaint = async (req, res) => {
    const { messageId, description } = req.body;
    const complainerEmail = req.user.email;

    try {
        // Validate messageId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid message ID format' 
            });
        }
        
        // Find the message and populate the sender
        const message = await PrivateChatMessage.findById(messageId)
            .populate('sender', 'email');
        
        if (!message) {
            return res.status(404).json({ 
                success: false, 
                message: 'Message not found' 
            });
        }

        if (!message.sender || !message.sender.email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Could not identify message sender' 
            });
        }

        // Create the complaint
        const complaint = await Complaint.create({
            messageId,
            senderEmail: message.sender.email,
            complainerEmail,
            description,
            messageContent: message.content // Store the message content
        });

        res.status(201).json({ success: true, data: complaint });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server Error creating complaint',
            error: error.message 
        });
    }
};

// @desc    Get all complaints (admin only)
// @route   GET /api/complaints
// @access  Private (Admin)
exports.getComplaints = async (req, res, next) => {
    try {
        // For admins, only show pending complaints
        const complaints = await Complaint.find({ status: 'pending' })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's complaints (both sent and received)
// @route   GET /api/complaints/user
// @access  Private
exports.getUserComplaints = async (req, res, next) => {
    try {
        const userEmail = req.user.email;
        
        // Get complaints sent by the user
        const sentComplaints = await Complaint.find({ complainerEmail: userEmail })
            .sort({ createdAt: -1 });

        // Get complaints against the user
        const receivedComplaints = await Complaint.find({ senderEmail: userEmail })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                sent: sentComplaints,
                received: receivedComplaints
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin)
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status value
        if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status value. Must be one of: pending, reviewed, resolved' 
            });
        }

        // Validate complaint ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid complaint ID format' 
            });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!complaint) {
            return res.status(404).json({ 
                success: false, 
                message: 'Complaint not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: complaint 
        });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error updating complaint status',
            error: error.message 
        });
    }
}; 