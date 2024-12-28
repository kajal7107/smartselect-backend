const { Router } = require('express');
const QuestionController = require('../controllers/questionController');
const multer = require('multer');
const upload = multer();

const router = Router();
const questionController = new QuestionController();

router.post('/generate', 
  (req, res, next) => {
    upload.single('pdf')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  questionController.generateQuestions
);

module.exports = router; 