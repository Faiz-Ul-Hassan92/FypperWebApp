const express = require('express');
const {
    getSupervisorIdeas,
    createSupervisorIdea,
    deleteSupervisorIdea,
    getSupervisorIdeasById
} = require('../controllers/supervisorIdeaController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes that require supervisor role
router.route('/ideas')
    .get(authorize('supervisor'), getSupervisorIdeas)
    .post(authorize('supervisor'), createSupervisorIdea);

router.route('/ideas/:id')
    .delete(authorize('supervisor'), deleteSupervisorIdea);

// Route to get ideas for a specific supervisor (accessible to all authenticated users)
router.get('/:supervisorId/ideas', getSupervisorIdeasById);

module.exports = router; 