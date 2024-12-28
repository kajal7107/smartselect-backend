const Assessment = require('../models/Assessment');
const Job = require('../models/Job');

class AssessmentController {
  // Create a new assessment
  createAssessment = async (req, res) => {
    try {
      const assessment = new Assessment(req.body);
      const savedAssessment = await assessment.save();

      // Update the associated job
      await Job.findByIdAndUpdate(req.body.jobId, {
        hasAssessment: true,
        assessmentId: savedAssessment._id
      });

      res.status(201).json(savedAssessment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all assessments
  getAllAssessments = async (req, res) => {
    try {
      const assessments = await Assessment.find()
        .populate('jobId', 'title department')
        .populate('createdBy', 'name email');
      res.status(200).json(assessments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get assessment by ID
  getAssessmentById = async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.id)
        .populate('jobId', 'title department')
        .populate('createdBy', 'name email');
      
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.status(200).json(assessment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update assessment
  updateAssessment = async (req, res) => {
    try {
      const assessment = await Assessment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('jobId', 'title department')
       .populate('createdBy', 'name email');

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.status(200).json(assessment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Delete assessment
  deleteAssessment = async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Update the associated job
      await Job.findByIdAndUpdate(assessment.jobId, {
        hasAssessment: false,
        assessmentId: null
      });

      await Assessment.findByIdAndDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get assessments by job ID
  getAssessmentsByJobId = async (req, res) => {
    try {
      const assessments = await Assessment.find({ jobId: req.params.jobId })
        .populate('jobId', 'title department')
        .populate('createdBy', 'name email');
      res.status(200).json(assessments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update assessment status
  updateAssessmentStatus = async (req, res) => {
    try {
      const { status } = req.body;
      if (!['draft', 'active', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const assessment = await Assessment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }
      res.status(200).json(assessment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
}

module.exports = AssessmentController; 