const mongoose = require('mongoose');

// MCQ Option Schema
const mcqOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

// Question Schema
const questionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['mcq', 'short_answer', 'coding'], 
    required: true 
  },
  question: { type: String, required: true },
  points: { type: Number, required: true, default: 10 },
  options: [mcqOptionSchema], // for MCQ
  expectedAnswer: String, // for short answer
  codeTemplate: String, // for coding
  description: String,//for interview
  timeLimit: Number // in minutes
}, { timestamps: true });

// Round Schema
const roundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ['written', 'interview'], 
    required: true 
  },
  duration: { type: Number, required: true }, // in minutes
  questions: [questionSchema],
  passingScore: Number,
  interviewGuidelines: String // for interview rounds
}, { timestamps: true });

// Assessment Schema
const assessmentSchema = new mongoose.Schema({
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    default:"66f111111111111111111111"
  },
  rounds: [roundSchema],
  status: { 
    type: String, 
    enum: ['draft', 'active', 'archived'], 
    default: 'draft' 
  },
  totalDuration: { 
    type: Number,
    default: function() {
      return this.rounds.reduce((total, round) => total + (round.duration || 0), 0);
    }
  },
  metadata: {
    difficulty: String,
    tags: [String],
    requiredSkills: [String],
    targetRole: String
  },
  settings: {
    randomizeQuestions: { type: Boolean, default: false },
    showFeedbackAfterEachQuestion: { type: Boolean, default: false },
    allowReview: { type: Boolean, default: true },
    proctoring: {
      enabled: { type: Boolean, default: false },
      type: { 
        type: String, 
        enum: ['automated', 'manual'], 
        default: 'automated' 
      },
      features: [{
        type: String,
        enum: ['screen_sharing', 'video', 'audio']
      }]
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting total questions count
assessmentSchema.virtual('totalQuestions').get(function() {
  return this.rounds.reduce((total, round) => total + round.questions.length, 0);
});

// Pre-save middleware to update totalDuration
assessmentSchema.pre('save', function(next) {
  this.totalDuration = this.rounds.reduce((total, round) => total + (round.duration || 0), 0);
  next();
});

// Create indexes
assessmentSchema.index({ jobId: 1, status: 1 });
assessmentSchema.index({ createdBy: 1 });
assessmentSchema.index({ 'metadata.tags': 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;