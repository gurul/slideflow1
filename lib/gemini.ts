import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Get the Gemini Pro model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateText(prompt: string) {
  try {
    console.log('Attempting to generate text with prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating text:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

// For image analysis (if needed)
export async function analyzeImage(imageData: string, prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    const imageParts = [
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg'
        }
      }
    ];
    
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing image:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
} 