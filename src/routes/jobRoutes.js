const { Router } = require('express');
const JobController = require('../controllers/jobController');

const router = Router();
const jobController = new JobController();

// CRUD routes
router.post('/', jobController.createJob);
router.get('/', jobController.getAllJobs);
router.get('/active', jobController.getActiveJobs);
router.get('/:id', jobController.getJobById);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);

module.exports = router; 