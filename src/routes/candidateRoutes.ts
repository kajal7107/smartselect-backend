import { Router } from 'express';
import { CandidateController } from '../controllers/candidateController';

const router = Router();
const candidateController = new CandidateController();

router.get('/', candidateController.getAllCandidates);
router.get('/:id', candidateController.getCandidateById);
router.post('/', candidateController.createCandidate);
router.put('/:id', candidateController.updateCandidate);
router.delete('/:id', candidateController.deleteCandidate);

export default router; 