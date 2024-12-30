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
}

module.exports = AiService; 