const { Router } = require('express');
const AssessmentSubmissionController = require('../controllers/assessmentSubmissionController');

const router = Router();
const submissionController = new AssessmentSubmissionController();

// CRUD routes
router.post('/', submissionController.createSubmission);
router.get('/', submissionController.getAllSubmissions);
router.get('/:id', submissionController.getSubmissionById);
router.put('/:id', submissionController.updateSubmission);

// Additional routes
router.get('/candidate/:candidateId', submissionController.getSubmissionsByCandidate);
router.post('/:id/round', submissionController.submitRoundAnswers);
router.post('/:id/complete', submissionController.completeSubmission);
router.post('/:id/feedback', submissionController.addFeedback);

module.exports = router; 