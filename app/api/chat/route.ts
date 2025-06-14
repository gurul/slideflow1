import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, pdfBase64, context } = await req.json();

    const floPersona = `you are Flo. Flo is a calm, insightful, and quietly witty AI assistant who helps you perfect your presentations. She's like a seasoned speaking coach and creative partner in one—minimalist in style, encouraging in tone, and laser-focused on flow. Always supportive, never overbearing, Flo guides with subtle prompts and thoughtful feedback to help you speak with clarity and confidence.`;

    const contextPrompt = context
      ? `Here is some context about my presentation. Use this information ONLY if it is directly relevant to my question or if I ask for it. Do NOT mention or repeat this context unless necessary. Do NOT use phrases like 'please allow me a moment', 'let me process this', or similar. Respond directly with your analysis or answer. Context: ${context}`
      : undefined;

    const contents = [
      floPersona,
      contextPrompt,
      message,
      pdfBase64
        ? {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          }
        : undefined,
    ].filter(Boolean);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(contents);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      response: text,
      success: true 
    });

  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('API key not valid')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your GOOGLE_GEMINI_API_KEY in .env.local', success: false },
        { status: 401 }
      );
    }
    
    if (error.message?.includes('models/gemini-2.0-flash is not found')) {
      return NextResponse.json(
        { error: 'Model not found. Please check the model name and API version.', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response', success: false },
      { status: 500 }
    );
  }
} 