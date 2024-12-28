const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  level: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Remote', 'Hybrid']
  },
  closingDate: { type: Date, required: true },
  description: { type: String, required: true },
  hasAssessment: { type: Boolean, default: false },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema); 