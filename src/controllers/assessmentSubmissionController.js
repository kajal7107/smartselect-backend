const AssessmentSubmission = require('../models/AssessmentSubmission');
const Candidate = require('../models/Candidate');

class AssessmentSubmissionController {
  // Create a new submission
  createSubmission = async (req, res) => {
    try {
      // First find the candidate to ensure it exists
      const candidate = await Candidate.findById(req.body.candidateId);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      // Create and save the submission
      const submission = new AssessmentSubmission(req.body);
      submission.startedAt = new Date();
      const savedSubmission = await submission.save();

      // Update candidate with assessment and submission references
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        req.body.candidateId,
        {
          status: 'scheduled',
          interviewDate: req.body.interviewDate,
          assessment: req.body.assessmentId,
          assessmentSubmission: savedSubmission._id
        },
        { new: true }
      );

      if (!updatedCandidate) {
        // If update failed, delete the submission
        await AssessmentSubmission.findByIdAndDelete(savedSubmission._id);
        return res.status(500).json({ error: 'Failed to update candidate' });
      }
      
      // Return the saved submission with populated references
      const populatedSubmission = await AssessmentSubmission.findById(savedSubmission._id)
        .populate('assessmentId')
        .populate('candidateId');

      res.status(201).json(populatedSubmission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Get all submissions
  getAllSubmissions = async (req, res) => {
    try {
      const submissions = await AssessmentSubmission.find()
        .populate('assessmentId')
        .populate('candidateId')
        .populate('jobId');
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get submission by ID
  getSubmissionById = async (req, res) => {
    try {
      const submission = await AssessmentSubmission.findById(req.params.id)
        .populate('assessmentId')
        .populate('candidateId')
        .populate('jobId');
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.status(200).json(submission);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Get submissions by candidate
  getSubmissionsByCandidate = async (req, res) => {
    try {
      const submissions = await AssessmentSubmission.find({ 
        candidateId: req.params.candidateId 
      })
        .populate('assessmentId')
        .populate('jobId')
        .sort({ createdAt: -1 });
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update submission
  updateSubmission = async (req, res) => {
    try {
      const submission = await AssessmentSubmission.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('assessmentId')
       .populate('candidateId')
       .populate('jobId');

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.status(200).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Submit round answers
  submitRoundAnswers = async (req, res) => {
    try {
      const { roundId, answers } = req.body;
      const submission = await AssessmentSubmission.findById(req.params.id);

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const roundSubmission = submission.rounds.find(r => r.roundId.toString() === roundId);
      if (!roundSubmission) {
        return res.status(404).json({ error: 'Round not found in submission' });
      }

      roundSubmission.answers = answers;
      roundSubmission.completedAt = new Date();
      
      // Calculate round score if all answers are provided
      if (answers.every(answer => answer.score !== undefined)) {
        roundSubmission.score = answers.reduce((total, answer) => total + answer.score, 0);
      }

      await submission.save();
      res.status(200).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Complete submission
  completeSubmission = async (req, res) => {
    try {
      const submission = await AssessmentSubmission.findById(req.params.id);
      
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      submission.status = 'completed';
      submission.completedAt = new Date();
      
      // Calculate overall score
      if (submission.rounds.every(round => round.score !== undefined)) {
        submission.overallScore = submission.rounds.reduce((total, round) => total + round.score, 0);
      }

      await submission.save();
      res.status(200).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // Add feedback
  addFeedback = async (req, res) => {
    try {
      const { feedback } = req.body;
      const submission = await AssessmentSubmission.findByIdAndUpdate(
        req.params.id,
        { feedback },
        { new: true, runValidators: true }
      );

      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.status(200).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
}

module.exports = AssessmentSubmissionController; 