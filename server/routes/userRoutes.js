const express = require('express');
const {
  getUsers,      // Admin: Get all users (potentially filtered)
  getUserById,   // Admin: Get a single user
  deleteUser,    // Admin: Delete a user
  getSupervisors, // Get users with role 'supervisor'
  getRecruiters,  // Get users with role 'recruiter'
  searchUsers,    // Import searchUsers
  updateUserSkills
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes accessible to authenticated users (used for finding collaborators)
router.use(protect);

// Route to search users by name
router.get('/search', searchUsers);

// Route to get potential supervisors
router.get('/supervisors', getSupervisors);

// Route to get potential recruiters
router.get('/recruiters', getRecruiters);

// Route to update user skills
router.put('/skills', updateUserSkills);

// --- Admin Only Routes Below ---
// Apply protect and admin authorization middleware for subsequent routes
router.use(authorize('admin'));

// @route   GET /api/users
// @desc    Get all users (Admin view)
// @access  Private (Admin)
router.get('/', getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin view)
// @access  Private (Admin)
router.get('/:id', getUserById);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin)
router.delete('/:id', deleteUser);

module.exports = router; 