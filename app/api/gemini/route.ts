import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    const response = await generateText(prompt);
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    let errorMessage = 'Failed to generate response';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('API key')) {
        statusCode = 401;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 