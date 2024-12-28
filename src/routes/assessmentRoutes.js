const { Router } = require('express');
const AssessmentController = require('../controllers/assessmentController');

const router = Router();
const assessmentController = new AssessmentController();

// CRUD routes
router.post('/', assessmentController.createAssessment);
router.get('/', assessmentController.getAllAssessments);
router.get('/:id', assessmentController.getAssessmentById);
router.put('/:id', assessmentController.updateAssessment);
router.delete('/:id', assessmentController.deleteAssessment);

// Additional routes
router.get('/job/:jobId', assessmentController.getAssessmentsByJobId);
router.patch('/:id/status', assessmentController.updateAssessmentStatus);

module.exports = router; 