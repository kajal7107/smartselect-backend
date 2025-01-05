const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

class AiService {
  constructor() {
    this.client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
    );
    this.deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
  }

  async generateQuestions(text, questionConfig) {
    try {
      const { 
        mcq = 0, 
        short_ans = 0, 
        coding = 0, 
        difficulty_level = 3,
        description = ''
      } = questionConfig;
      
      if (difficulty_level < 1 || difficulty_level > 5) {
        throw new Error('Difficulty level must be between 1 and 5');
      }

      const prompt = `Generate a set of questions based on the following content. The response should be in valid JSON format with the following specifications:

      - Generate ${mcq} MCQ questions
      - Generate ${short_ans} short answer questions
      - Generate ${coding} coding questions
      - Difficulty level: ${difficulty_level} (on a scale of 1-5)
      ${description ? `\nAdditional requirements: ${description}` : ''}

      Each question should follow this format:
      - MCQ: { type: "mcq", question: string, points: 10, options: [{ text: string, isCorrect: boolean }] }
      - Short Answer: { type: "short_answer", question: string, points: 10, expectedAnswer: string }
      - Coding: { type: "coding", question: string, points: 10, codeTemplate: string }

      Content: ${text}

      Return only the JSON array of questions.`;

      const messages = [
        { 
          role: "system", 
          content: "You are an AI assistant that generates assessment questions. Always respond with valid JSON arrays."
        },
        { 
          role: "user", 
          content: prompt
        }
      ];

      const response = await this.client.getChatCompletions(
        this.deploymentId,
        messages
      );

      const content = response.choices[0].message.content;
      const cleanContent = content.replace(/```json\n|\n```|```/g, '').trim();
      
      try {
        return JSON.parse(cleanContent);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from AI: ${cleanContent}`);
      }
    } catch (error) {
      throw new Error(`Question generation failed: ${error.message}`);
    }
  }

  assessAnswers = async (answers) => {
    try {
      // Process each answer based on type
      const assessments = await Promise.all(answers.map(async answer => {
        let score = 0;

        try {
          switch (answer.type) {
            case 'mcq':
              // Find the correct options from the answer options
              // if (answer.options && Array.isArray(answer.options)) {
              //   const correctOptions = answer.options.filter(opt => opt.isCorrect);
              //   console.log('Correct options:', correctOptions);
              //   console.log('Selected option:', answer.selectedOption);
                
              //   // Check if selected option matches any of the correct options
              //   if (correctOptions.some(opt => opt.text === answer.selectedOption)) {
              //     score = answer.points;
              //   }
              // }
              score = answer.points;
              break;

            case 'short_answer':
              // For now, assign 50% of points for any answer
              score = Math.floor(answer.points * 0.5);
              break;

            case 'coding':
              // For now, assign 50% of points for any code submission
              score = Math.floor(answer.points * 0.5);
              break;

            default:
              score = 0;
          }

          return {
            questionId: answer.questionId,
            score: score
          };
        } catch (error) {
          console.error(`Error assessing answer ${answer.questionId}:`, error);
          return {
            questionId: answer.questionId,
            score: 0
          };
        }
      }));

      // Filter out any null results and ensure we have valid scores
      return assessments.filter(assessment => 
        assessment && 
        assessment.questionId && 
        typeof assessment.score === 'number'
      );

    } catch (error) {
      console.error('Assessment Error:', error);
      return answers.map(answer => ({
        questionId: answer.questionId,
        score: 0
      }));
    }
  };

  // Add AI evaluation methods here
  evaluateShortAnswer = async (question, expected, submitted, maxPoints) => {
    // Implement AI evaluation for short answers
    // Return score and feedback
  };

  evaluateCode = async (question, expected, submitted, maxPoints) => {
    // Implement AI evaluation for code
    // Return score and feedback
  };
}

module.exports = AiService; 