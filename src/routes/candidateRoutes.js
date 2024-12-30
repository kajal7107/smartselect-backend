const { Router } = require('express');
const CandidateController = require('../controllers/candidateController');

const router = Router();
const candidateController = new CandidateController();

// Add login route
router.post('/login', candidateController.loginCandidate);

router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidateById);
router.post('/', candidateController.createCandidate);
router.put('/:id', candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);

module.exports = router; 