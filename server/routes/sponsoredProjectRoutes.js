const express = require('express');
const {
    getSponsoredProjects,
    createSponsoredProject,
    deleteSponsoredProject,
    getRecruiterProjectsById
} = require('../controllers/sponsoredProjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes that require recruiter role
router.route('/projects')
    .get(authorize('recruiter'), getSponsoredProjects)
    .post(authorize('recruiter'), createSponsoredProject);

router.route('/projects/:id')
    .delete(authorize('recruiter'), deleteSponsoredProject);

// Route to get projects for a specific recruiter (accessible to all authenticated users)
router.get('/:recruiterId/projects', getRecruiterProjectsById);

module.exports = router; 