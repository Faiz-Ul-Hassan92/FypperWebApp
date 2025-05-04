const express = require('express');
const { createComplaint, getComplaints, getUserComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const Complaint = require('../models/Complaint');

const router = express.Router();

// Test route to verify model is working
router.get('/test', async (req, res) => {
    try {
        const testComplaint = await Complaint.create({
            messageId: '123456789012345678901234', // This is just a test ID
            senderEmail: 'test@example.com',
            complainerEmail: 'test2@example.com',
            description: 'Test complaint'
        });
        res.json({ success: true, data: testComplaint });
    } catch (error) {
        console.error('Test route error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get user's complaints (both sent and received)
router.get('/user', protect, getUserComplaints);

// Create complaint (accessible to all authenticated users)
router.post('/', protect, createComplaint);

// Get all complaints (admin only)
router.get('/', protect, authorize('admin'), getComplaints);

// Update complaint status (admin only)
router.put('/:id/status', protect, authorize('admin'), express.json(), updateComplaintStatus);

module.exports = router; 