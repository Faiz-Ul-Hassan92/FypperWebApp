const express = require('express');
const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  // deleteRequest // Usually requests aren't deleted, just status changed
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to create a new request (join, supervisor, recruiter)
// Accessible to students
router.post('/', protect, authorize('student'), createRequest);

// Route to get requests
// Needs logic in controller to determine which requests to show based on user role
// e.g., students see their outgoing requests
// project owners see incoming join requests
// supervisors/recruiters see their incoming requests
router.get('/', protect, getRequests);

// Route to get a single request by ID
// Needs authorization logic in controller
router.get('/:id', protect, getRequestById);

// Route to update a request status (approve/reject)
// Accessible to the user the request is TO (project owner, supervisor, recruiter)
router.put('/:id/status', protect, updateRequestStatus);

module.exports = router; 