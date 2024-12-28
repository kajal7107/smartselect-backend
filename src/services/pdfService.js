const pdf = require('pdf-parse');
const fs = require('fs');

class PdfService {
  async extractTextFromPdf(pdfBuffer) {
    try {
      const data = await pdf(pdfBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}

module.exports = PdfService; 