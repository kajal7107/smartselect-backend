const AssessmentSubmission = require('../models/AssessmentSubmission');
const Assessment = require('../models/Assessment');
const Candidate = require('../models/Candidate');
const AIService = require('../services/aiService');
const mongoose = require('mongoose');

class AssessmentSubmissionController {
  constructor() {
    this.aiService = new AIService();
  }

  // Create a new submission
  createSubmission = async (req, res) => {
    try {
      console.log('Starting submission creation...');

      // Validate input
      if (!req.body.assessmentId || !req.body.candidateId || !req.body.interviewDate) {
        return res.status(400).json({ 
          error: 'Required fields missing: assessmentId, candidateId, interviewDate' 
        });
      }

      // Find the assessment and candidate
      const [assessment, candidate] = await Promise.all([
        Assessment.findById(req.body.assessmentId),
        Candidate.findById(req.body.candidateId)
      ]);

      if (!assessment || !candidate) {
        return res.status(404).json({ 
          error: !assessment ? 'Assessment not found' : 'Candidate not found' 
        });
      }

      console.log('Found assessment and candidate');

      // Create submission data with complete round information
      const submissionData = {
        assessmentId: assessment._id,
        candidateId: candidate._id,
        status: 'in_progress',
        startedAt: new Date(),
        interviewDate: new Date(req.body.interviewDate),
        rounds: assessment.rounds.map((round, index) => ({
          roundId: round._id,
          questionRoundId: round._id,
          title: round.title,
          description: round.description,
          type: round.type,
          duration: round.duration,
          passingScore: round.passingScore,
          interviewGuidelines: round.interviewGuidelines,
          status: index === 0 ? 'active' : 'not_started',
          isCurrentRound: index === 0,
          roundScheduledAt: index === 0 ? new Date(req.body.interviewDate) : null,
          startedAt: index === 0 ? new Date(req.body.interviewDate) : null,
          answers: round.questions.map(question => ({
            questionId: question._id,
            type: question.type,
            question: question.question,
            points: question.points,
            options: question.options,
            expectedAnswer: question.expectedAnswer,
            codeTemplate: question.codeTemplate,
            description: question.description,
            timeLimit: question.timeLimit,
            selectedOption: null,
            writtenAnswer: '',
            submittedCode: '',
            isCorrect: null,
            score: 0,
            timeSpent: 0,
            feedback: ''
          })),
          score: 0,
          feedback: {
            interviewer: null,
            notes: '',
            technicalScore: 0,
            communicationScore: 0,
            recommendation: ''
          }
        })),
        overallScore: 0,
        result: 'pending',
        feedback: {
          strengths: [],
          areasOfImprovement: [],
          recommendation: ''
        }
      };

      console.log('Created submission data structure');

      // Create and validate submission
      const submission = new AssessmentSubmission(submissionData);
      
      // Log any validation errors
      const validationError = submission.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ error: validationError.message });
      }

      // Save submission
      console.log('Attempting to save submission...');
      const savedSubmission = await submission.save();
      console.log('Submission saved successfully:', savedSubmission._id);

      // Update candidate
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        candidate._id,
        {
          status: 'scheduled',
          interviewDate: new Date(req.body.interviewDate),
          assessment: assessment._id,
          assessmentSubmission: savedSubmission._id
        },
        { new: true }
      );

      console.log('Candidate updated successfully');

      // Return populated submission
      const populatedSubmission = await AssessmentSubmission.findById(savedSubmission._id)
        .populate('assessmentId')
        .populate('candidateId');

      res.status(201).json(populatedSubmission);
    } catch (error) {
      console.error('Error in createSubmission:', error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

  // Get all submissions
  getAllSubmissions = async (req, res) => {
    try {
      const submissions = await AssessmentSubmission.find()
        .populate('assessmentId')
        .populate('candidateId');
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
        .populate('candidateId');
      
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
       .populate('candidateId');

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
      const { submissionId, roundId } = req.params;
      const { answers, interviewFeedback } = req.body;

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const round = submission.rounds.find(r => r._id.toString() === roundId);
      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }

      if (!round.isCurrentRound) {
        return res.status(400).json({ error: 'This round is not currently active' });
      }

      // Check if it's an interview round
      if (round.type === 'interview') {
        if (!interviewFeedback) {
          return res.status(400).json({ error: 'Interview feedback is required' });
        }

        // For interview rounds, update the status and save feedback
        round.status = 'feedback_pending';
        
        // Update candidate status and feedback
        await Candidate.findByIdAndUpdate(
          submission.candidateId,
          { 
            status: 'feedback_pending',
            currentRound: roundId,
            nextRoundId: null, // Will be set when feedback is given
            isLastRound: false, // Will be determined when feedback is given
            interviewFeedback: interviewFeedback // Save the interview feedback
          },
          { new: true }
        );

        await submission.save();
        return res.status(200).json(round);
      }

      // Validate answers
      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: 'Answers must be an array' });
      }

      // Update only the provided fields in answers
      round.answers = round.answers.map(existingAnswer => {
        const newAnswer = answers.find(a => a.questionId.toString() === existingAnswer.questionId.toString());
        if (newAnswer) {
          // For MCQ answers, validate that the selectedOption matches one of the available options
          if (existingAnswer.type === 'mcq' && newAnswer.selectedOption) {
            const isValidOption = existingAnswer.options.some(
              option => option.text === newAnswer.selectedOption
            );
            if (!isValidOption) {
              throw new Error(`Invalid option selected for question ${existingAnswer.question}`);
            }
          }

          // Only update fields that are provided in newAnswer
          return Object.keys(newAnswer).reduce((updated, key) => {
            if (newAnswer[key] !== undefined) {
              updated[key] = newAnswer[key];
            }
            return updated;
          }, { ...existingAnswer.toObject() });
        }
        return existingAnswer;
      });

      // Set round status to feedback_pending
      round.status = 'feedback_pending';

      // Save the submission first
      await submission.save();

      // Check if this is the last round
      const currentRoundIndex = submission.rounds.indexOf(round);
      const isLastRound = currentRoundIndex === submission.rounds.length - 1;

      // Get next round ID if it exists
      const nextRoundId = isLastRound ? null : submission.rounds[currentRoundIndex + 1]._id;

      // Update candidate status, current round, next round, and isLastRound
      await Candidate.findByIdAndUpdate(
        submission.candidateId,
        { 
          status: 'feedback_pending',
          currentRound: roundId,
          nextRoundId: nextRoundId,
          isLastRound: isLastRound
        },
        { new: true }
      );

      res.status(200).json(round);
    } catch (error) {
      console.error('Error in submitRoundAnswers:', error);
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

  // Get a specific round from a submission
  getRound = async (req, res) => {
    try {
      const { submissionId, roundId } = req.params;
      console.log('Getting round with params:', { submissionId, roundId });

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        console.log('Submission not found:', submissionId);
        return res.status(404).json({ error: 'Submission not found' });
      }
      console.log('Found submission:', submission._id);

      const round = submission.rounds.find(r => r._id.toString() === roundId);
      if (!round) {
        console.log('Round not found:', roundId);
        console.log('Available rounds:', submission.rounds.map(r => r._id));
        return res.status(404).json({ error: 'Round not found' });
      }
      console.log('Found round:', round._id);

      res.status(200).json(round);
    } catch (error) {
      console.error('Error in getRound:', error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

  // Get current active round
  getCurrentRound = async (req, res) => {
    try {
      const { submissionId } = req.params;

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const currentRound = submission.rounds.find(r => r.isCurrentRound);
      if (!currentRound) {
        return res.status(404).json({ error: 'No active round found' });
      }

      res.status(200).json(currentRound);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Update a specific round
  updateRound = async (req, res) => {
    try {
      const { submissionId, roundId } = req.params;
      const updateData = req.body;

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const roundIndex = submission.rounds.findIndex(r => r._id.toString() === roundId);
      if (roundIndex === -1) {
        return res.status(404).json({ error: 'Round not found' });
      }

      // Update round data (excluding feedback if not provided)
      if (updateData.feedback) {
        submission.rounds[roundIndex].feedback = {
          ...submission.rounds[roundIndex].feedback,
          ...updateData.feedback
        };
        delete updateData.feedback;
      }
      Object.assign(submission.rounds[roundIndex], updateData);

      // If marking round as completed
      if (updateData.status === 'completed') {
        // Update current round
        submission.rounds[roundIndex].isCurrentRound = false;
        submission.rounds[roundIndex].completedAt = new Date();

        // Set next round as current if available
        if (roundIndex + 1 < submission.rounds.length) {
          const nextRound = submission.rounds[roundIndex + 1];
          nextRound.isCurrentRound = true;
          nextRound.status = 'active';
          nextRound.roundScheduledAt = updateData.nextRoundDate || null;

          // Update candidate status and round info
          await Candidate.findByIdAndUpdate(
            submission.candidateId,
            {
              status: 'scheduled',
              currentRound: nextRound._id,
              nextRoundId: roundIndex + 2 < submission.rounds.length ? submission.rounds[roundIndex + 2]._id : null,
              isLastRound: roundIndex + 1 === submission.rounds.length - 1
            },
            { new: true }
          );
        } else {
          // If this was the last round
          await Candidate.findByIdAndUpdate(
            submission.candidateId,
            {
              status: 'confirmation_pending',
              currentRound: roundId,
              nextRoundId: null,
              isLastRound: true
            },
            { new: true }
          );
        }
      }

      await submission.save();
      res.status(200).json(submission.rounds[roundIndex]);
    } catch (error) {
      console.error('Error in updateRound:', error);
      res.status(400).json({ error: error.message });
    }
  };

  // Schedule next round
  scheduleNextRound = async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { scheduledDate } = req.body;

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const currentRoundIndex = submission.rounds.findIndex(r => r.isCurrentRound);
      if (currentRoundIndex === -1) {
        return res.status(404).json({ error: 'No active round found' });
      }

      if (currentRoundIndex + 1 >= submission.rounds.length) {
        return res.status(400).json({ error: 'No more rounds available' });
      }

      const nextRound = submission.rounds[currentRoundIndex + 1];
      nextRound.roundScheduledAt = new Date(scheduledDate);

      await submission.save();
      res.status(200).json(nextRound);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // AI Assessment of round answers
  assessRoundWithAI = async (req, res) => {
    try {
      const { submissionId, roundId } = req.params;

      const submission = await AssessmentSubmission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }

      const round = submission.rounds.find(r => r._id.toString() === roundId);
      if (!round) {
        return res.status(404).json({ error: 'Round not found' });
      }

      // Prepare answers for AI assessment
      const answersForAssessment = round.answers.map(answer => ({
        questionId: answer.questionId,
        type: answer.type,
        question: answer.question,
        expectedAnswer: answer.expectedAnswer,
        submittedAnswer: answer.type === 'mcq' ? answer.selectedOption :
                        answer.type === 'short_answer' ? answer.writtenAnswer :
                        answer.submittedCode,
        points: answer.points
      })).filter(answer => answer.submittedAnswer); // Only assess answers that have been submitted

      if (answersForAssessment.length === 0) {
        return res.status(400).json({ error: 'No answers to assess' });
      }

      // Call AI service to assess answers
      const aiAssessment = await this.aiService.assessAnswers(answersForAssessment);
      
      if (!aiAssessment || !Array.isArray(aiAssessment)) {
        throw new Error('Invalid assessment result from AI service');
      }

      // Format response to only include questionId and score, handling potential undefined values
      const scores = aiAssessment
        .filter(assessment => assessment && assessment.questionId) // Filter out invalid assessments
        .map(assessment => ({
          questionId: assessment.questionId,
          score: assessment.score || 0 // Default to 0 if score is undefined
        }));

      if (scores.length === 0) {
        return res.status(400).json({ error: 'No valid scores generated' });
      }

      res.status(200).json(scores);
    } catch (error) {
      console.error('Error in AI assessment:', error);
      res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
}

module.exports = AssessmentSubmissionController; 