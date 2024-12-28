const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

class AiService {
  constructor() {
    this.client = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
    );
    this.deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
  }

  async generateQuestions(text, questionType, description, numberOfQuestions) {
    try {
      let prompt;
      switch (questionType) {
        case 'mcq':
          prompt = `Generate ${numberOfQuestions} multiple choice questions based on this content. Return response in valid JSON array format without any markdown formatting or code blocks. Each question object should have: question (string), options (array of strings), and correctAnswer (string matching one of the options).`;
          break;
        case 'short_answer':
          prompt = `Generate ${numberOfQuestions} short answer questions based on this content. Return response in valid JSON array format without any markdown formatting or code blocks. Each question object should have: question (string) and sampleAnswer (string).`;
          break;
        case 'coding':
          prompt = `Generate ${numberOfQuestions} coding questions based on this content. Return response in valid JSON array format without any markdown formatting or code blocks. Each question object should have: question (string), sampleSolution (string), and testCases (array of objects with input and expectedOutput).`;
          break;
      }

      if (description) {
        prompt += ` Additional instructions: ${description}`;
      }

      prompt += `\n\nContent: ${text}\n\nRespond only with the JSON array, no other text.`;

      const messages = [
        { 
          role: "system", 
          content: "You are an AI assistant that generates high-quality assessment questions. Always respond with valid JSON arrays containing question objects."
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
      
      // Clean up the response to ensure valid JSON
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