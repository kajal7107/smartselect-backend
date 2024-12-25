const CandidateService = require('../services/candidateService');

class CandidateController {
  constructor() {
    this.candidateService = new CandidateService();
  }

  getAllCandidates = async (req, res) => {
    try {
      const candidates = await this.candidateService.getAllCandidates();
      res.status(200).json(candidates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch candidates' });
    }
  };

  getCandidateById = async (req, res) => {
    try {
      const candidate = await this.candidateService.getCandidateById(req.params.id);
      if (!candidate) {
        res.status(404).json({ error: 'Candidate not found' });
        return;
      }
      res.status(200).json(candidate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch candidate' });
    }
  };

  createCandidate = async (req, res) => {
    try {
      const newCandidate = await this.candidateService.createCandidate(req.body);
      res.status(201).json(newCandidate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create candidate' });
    }
  };

  updateCandidate = async (req, res) => {
    try {
      const updatedCandidate = await this.candidateService.updateCandidate(
        req.params.id,
        req.body
      );
      if (!updatedCandidate) {
        res.status(404).json({ error: 'Candidate not found' });
        return;
      }
      res.status(200).json(updatedCandidate);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update candidate' });
    }
  };

  deleteCandidate = async (req, res) => {
    try {
      const deleted = await this.candidateService.deleteCandidate(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Candidate not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete candidate' });
    }
  };
}

module.exports = CandidateController; 