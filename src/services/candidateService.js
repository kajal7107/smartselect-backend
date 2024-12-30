const CandidateModel = require('../models/Candidate');

class CandidateService {
  async getAllCandidates() {
    return await CandidateModel.find();
  }

  async getCandidateById(id) {
    return await CandidateModel.findById(id);
  }

  async createCandidate(candidateData) {
    const candidate = new CandidateModel(candidateData);
    return await candidate.save();
  }

  async updateCandidate(id, candidateData) {
    return await CandidateModel.findByIdAndUpdate(id, candidateData, { new: true });
  }

  async deleteCandidate(id) {
    const result = await CandidateModel.findByIdAndDelete(id);
    return result !== null;
  }

  async getCandidateByEmail(email) {
    return await CandidateModel.findOne({ email });
  }
}

module.exports = CandidateService; 