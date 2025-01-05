const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['mcq', 'short_answer', 'coding'],
    required: true 
  },
  question: { type: String, required: true },
  points: { type: Number, required: true },
  options: [{
    text: { type: String },
    isCorrect: { type: Boolean }
  }],
  expectedAnswer: String,
  codeTemplate: String,
  description: String,
  timeLimit: Number,
  selectedOption: String,
  writtenAnswer: String,
  submittedCode: String,
  isCorrect: Boolean,
  score: Number,
  timeSpent: Number,
  feedback: String
});

const roundSchema = new mongoose.Schema({
  roundId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  questionRoundId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  title: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['written', 'interview'], 
    required: true 
  },
  duration: { type: Number, required: true },
  passingScore: Number,
  interviewGuidelines: String,
  status: {
    type: String,
    enum: ['not_started', 'active', 'completed', 'failed', 'feedback_pending'],
    default: 'not_started'
  },
  isCurrentRound: { type: Boolean, default: false },
  roundScheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  answers: [answerSchema],
  score: Number,
  feedback: {
    interviewer: String,
    notes: String,
    technicalScore: Number,
    communicationScore: Number,
    recommendation: String
  }
});

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  rounds: [roundSchema],
  startedAt: Date,
  interviewDate: Date,
  completedAt: Date,
  overallScore: Number,
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },
  feedback: {
    strengths: [String],
    areasOfImprovement: [String],
    recommendation: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add this to debug validation issues
assessmentSubmissionSchema.pre('save', function(next) {
  console.log('Saving submission:', this);
  next();
});

// Indexes for better query performance
assessmentSubmissionSchema.index({ assessmentId: 1, candidateId: 1 });
assessmentSubmissionSchema.index({ candidateId: 1, completedAt: -1 });

const AssessmentSubmission = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);

module.exports = AssessmentSubmission;