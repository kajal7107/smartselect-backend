const { Router } = require('express');
const AssessmentSubmissionController = require('../controllers/assessmentSubmissionController');

const router = Router();
const submissionController = new AssessmentSubmissionController();

// Round-specific routes (should come first)
router.get('/:submissionId/current-round', submissionController.getCurrentRound);
router.get('/:submissionId/rounds/:roundId', submissionController.getRound);
router.put('/:submissionId/rounds/:roundId', submissionController.updateRound);
router.put('/:submissionId/rounds/:roundId/answers', submissionController.submitRoundAnswers);
router.post('/:submissionId/schedule-next-round', submissionController.scheduleNextRound);

// Candidate-specific routes
router.get('/candidate/:candidateId', submissionController.getSubmissionsByCandidate);

// Generic CRUD routes
router.post('/', submissionController.createSubmission);
router.get('/', submissionController.getAllSubmissions);
router.get('/:id', submissionController.getSubmissionById);
router.put('/:id', submissionController.updateSubmission);
router.post('/:id/round', submissionController.submitRoundAnswers);
router.post('/:id/complete', submissionController.completeSubmission);
router.post('/:id/feedback', submissionController.addFeedback);

// AI Assessment routes
router.post('/:submissionId/rounds/:roundId/assess', submissionController.assessRoundWithAI);

module.exports = router; 