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
      const { questionType, description, numberOfQuestions = 5, content } = req.body;
      
      if (!questionType || !['mcq', 'short_answer', 'coding'].includes(questionType)) {
        return res.status(400).json({ 
          error: 'Invalid question type. Must be one of: mcq, short_answer, coding' 
        });
      }

      if (numberOfQuestions < 1 || numberOfQuestions > 20) {
        return res.status(400).json({
          error: 'Number of questions must be between 1 and 20'
        });
      }

      // Get text either from PDF or direct content
      let text;
      if (req.file?.buffer) {
        text = await this.pdfService.extractTextFromPdf(req.file.buffer);
      } else if (req.body.content) {
        text = req.body.content;
      } else {
        return res.status(400).json({ 
          error: 'Either PDF file or content field must be provided in form-data' 
        });
      }
      
      // Generate questions using Azure OpenAI
      const questions = await this.aiService.generateQuestions(text, questionType, description, numberOfQuestions);

      res.status(200).json({ questions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = QuestionController; 