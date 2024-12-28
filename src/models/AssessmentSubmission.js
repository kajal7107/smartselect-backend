const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  selectedOption: String, // for MCQ
  writtenAnswer: String, // for short answer
  submittedCode: String, // for coding
  isCorrect: Boolean,
  score: Number,
  timeSpent: Number, // in minutes
  feedback: String
}, { timestamps: true });

const roundSubmissionSchema = new mongoose.Schema({
  roundId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  startedAt: Date,
  completedAt: Date,
  answers: [answerSchema],
  score: Number,
  feedback: {
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    technicalScore: Number,
    communicationScore: Number,
    recommendation: String
  }
}, { timestamps: true });

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  rounds: [roundSubmissionSchema],
  startedAt: Date,
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

// Indexes for better query performance
assessmentSubmissionSchema.index({ assessmentId: 1, candidateId: 1 });
assessmentSubmissionSchema.index({ jobId: 1, status: 1 });
assessmentSubmissionSchema.index({ candidateId: 1, completedAt: -1 });

const AssessmentSubmission = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema);

module.exports = AssessmentSubmission;