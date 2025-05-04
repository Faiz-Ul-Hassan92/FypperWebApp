const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  removeMember,
  removeSupervisor,
  removeRecruiter
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Include other resource routers if needed (e.g., requests for a project)
const requestRouter = require('./requestRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:projectId/requests', requestRouter);

// Route to get all projects (accessible to all logged-in users)
router.get('/', protect, getProjects);

// Route to get a single project by ID (accessible to all logged-in users)
router.get('/:id', protect, getProjectById);

// Route to create a new project (only accessible to students)
router.post('/', protect, authorize('student'), createProject);

// Route to update a project (only accessible to the project owner - logic in controller)
router.put('/:id', protect, authorize('student', 'admin'), updateProject);

// Route to delete a project (only accessible to the project owner or admin)
router.delete('/:id', protect, authorize('student', 'admin'), deleteProject);

// Route to remove a specific member (only project owner)
router.delete('/:projectId/members/:memberId', protect, authorize('student'), removeMember);

// Route to remove the supervisor (only project owner)
router.delete('/:projectId/supervisor', protect, authorize('student'), removeSupervisor);

// Route to remove the recruiter collaboration (only project owner)
router.delete('/:projectId/recruiter', protect, authorize('student'), removeRecruiter);

// Example routes for member management (needs implementation in controller)
// router.post('/:id/members', protect, authorize('student'), addMemberToProject);
// router.delete('/:id/members/:memberId', protect, authorize('student'), removeMemberFromProject);

module.exports = router; 