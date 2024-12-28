const Job = require('../models/Job');

class JobController {
  // Create a new job
  createJob = async (req, res) => {
    try {
      const job = new Job(req.body);
      const savedJob = await job.save();
      res.status(201).json(savedJob);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all jobs
  getAllJobs = async (req, res) => {
    try {
      const jobs = await Job.find();
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get a single job by ID
  getJobById = async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.status(200).json(job);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update a job
  updateJob = async (req, res) => {
    try {
      const job = await Job.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.status(200).json(job);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Delete a job
  deleteJob = async (req, res) => {
    try {
      const job = await Job.findByIdAndDelete(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get active jobs (not closed)
  getActiveJobs = async (req, res) => {
    try {
      const jobs = await Job.find({
        closingDate: { $gt: new Date() }
      });
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = JobController; 