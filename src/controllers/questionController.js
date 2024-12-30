const PdfService = require('../services/pdfService');
const AiService = require('../services/aiService');
const multer = require('multer');
const upload = multer();

class QuestionController {
  constructor() {
    this.pdfService = new PdfService();
    this.aiService = new AiService();
  }

  generateQuestions = async (req, res) => {
    try {
      const { mcq, short_ans, coding, difficulty_level, content, description } = req.body;
      
      // Validate inputs
      if (difficulty_level && (difficulty_level < 1 || difficulty_level > 5)) {
        return res.status(400).json({
          error: 'Difficulty level must be between 1 and 5'
        });
      }

      // Get text either from PDF or direct content
      let text;
      if (req.file?.buffer) {
        text = await this.pdfService.extractTextFromPdf(req.file.buffer);
      } else if (content) {
        text = content;
      } else {
        return res.status(400).json({ 
          error: 'Either PDF file or content field must be provided in form-data' 
        });
      }
      
      // Generate questions using Azure OpenAI
      const questions = await this.aiService.generateQuestions(text, {
        mcq: parseInt(mcq) || 0,
        short_ans: parseInt(short_ans) || 0,
        coding: parseInt(coding) || 0,
        difficulty_level: parseInt(difficulty_level) || 3,
        description: description || ''
      });

      res.status(200).json({ questions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = QuestionController; 