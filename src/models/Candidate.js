const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  appliedDate: { type: Date, default: Date.now },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  assessmentSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSubmission' },
  interviewDate: { type: Date },
  password: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: [
      'unscheduled',
      'scheduled',
      'feedback_pending',
      'confirmation_pending',
      'shortlisted'
    ]
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema); 