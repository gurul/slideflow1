import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const { messages, pdfBase64, context } = await req.json();

    // Check if PDF is provided and validate its size
    if (pdfBase64) {
      // Calculate base64 size in bytes (base64 is ~33% larger than binary)
      const base64Size = Buffer.byteLength(pdfBase64, 'utf8');
      const estimatedBinarySize = (base64Size * 3) / 4; // Approximate binary size
      
      console.log(`PDF base64 size: ${(base64Size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Estimated binary size: ${(estimatedBinarySize / 1024 / 1024).toFixed(2)} MB`);
      
      if (estimatedBinarySize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            error: 'The PDF file is too large. Please use a smaller file or compress it further.',
            success: false 
          },
          { status: 413 }
        );
      }
    }

    const floPersona = `You are Flo, a warm AI coach built into Slideflow. Be friendly and helpful, but don't mention presentation data unless asked.`;

    const contextPrompt = context
      ? `Here is some context about my presentation. Use this information ONLY if it is directly relevant to my question or if I ask for it. Do NOT mention or repeat this context unless necessary. Do NOT use phrases like 'please allow me a moment', 'let me process this', or similar. Respond directly with your analysis or answer. Context: ${context}`
      : undefined;

    const contents = [
      floPersona,
      contextPrompt,
      ...(messages || []).map((msg: { role: string; parts: { text: string }[] }) => msg.parts[0].text),
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

    // Ensure we have a valid response
    if (!text) {
      throw new Error('No response from Gemini API');
    }

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

    // Handle file size errors from Gemini
    if (error.message?.includes('file too large') || error.message?.includes('size limit')) {
      return NextResponse.json(
        { error: 'The PDF file is too large for processing. Please compress it further or use a smaller file.', success: false },
        { status: 413 }
      );
    }

    // Handle any other errors
    return NextResponse.json(
      { error: error.message || 'Failed to generate response', success: false },
      { status: 500 }
    );
  }
} 