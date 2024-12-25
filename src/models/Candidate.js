const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  appliedDate: { type: Date, default: Date.now },
  assessments: [{ type: String }],
  status: { 
    type: String, 
    required: true
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema); 