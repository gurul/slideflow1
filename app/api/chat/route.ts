import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Maximum file size in bytes (4MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

// Initialize Google Generative AI client
let genAI: GoogleGenerativeAI | null = null;

function initializeGenAI() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function POST(req: NextRequest) {
  let parsedData: any = null;
  
  try {
    parsedData = await req.json();
    const { messages, pdfBase64, context } = parsedData;

    // Check if PDF is provided and validate its size
    if (pdfBase64) {
      // Calculate base64 size in bytes (base64 is ~33% larger than binary)
      const base64Size = Buffer.byteLength(pdfBase64, 'utf8');
      const estimatedBinarySize = (base64Size * 3) / 4; // Approximate binary size
      
      if (estimatedBinarySize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { 
            error: 'The PDF file is too large. Please compress it to under 4MB.',
            success: false 
          },
          { status: 413 }
        );
      }
    }

    // Get the user's latest message
    const userMessage = messages && messages.length > 0 
      ? messages[messages.length - 1]?.parts?.[0]?.text || ''
      : '';

    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'No message provided', success: false },
        { status: 400 }
      );
    }

    // Initialize the AI client
    const client = initializeGenAI();

    // Create the system prompt for Flo
    const systemPrompt = `You are Flo, a warm and encouraging AI presentation coach built into Slideflow. You help users practice and improve their presentations.

Your personality:
- Be friendly, supportive, and encouraging
- Give specific, actionable feedback
- Use a conversational tone
- Be concise but helpful
- Don't be overly formal

Your capabilities:
- Analyze presentation timing and pacing
- Review presentation content and structure
- Provide feedback on delivery based on transcripts
- Suggest improvements for clarity and flow
- Answer questions about presentation best practices

Important guidelines:
- Use the context information provided to give specific, relevant responses
- Reference slide numbers, timings, and transcript content when appropriate
- Don't mention that you're "analyzing" or "processing" - respond naturally
- Keep responses conversational and not too long
- If you don't have enough context to answer a question, ask for more information

${context ? `Context about the user's presentation: ${context}` : ''}`;
    
    const model = client.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    // Prepare the conversation history
    const conversationHistory = messages?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts
    })) || [];

    // Filter history to ensure it starts with a user message.
    let historyForGemini = conversationHistory.slice(0, -1);
    if (historyForGemini.length > 0 && historyForGemini[0].role === 'model') {
      historyForGemini.shift(); // Remove the first element if it's from the model
    }
    
    // Prepare the content parts for the Gemini API
    const contentParts: any[] = [{ text: userMessage }];

    if (pdfBase64) {
      contentParts.push({
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      });
    }

    // Start a chat session
    const chat = model.startChat({
      history: historyForGemini,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Send the message to Gemini
    const result = await chat.sendMessage(contentParts);

    const response = await result.response;
    const responseText = response.text();

    return NextResponse.json({ 
      response: responseText,
      success: true 
    });

  } catch (error: any) {
    console.error('AI API error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('API_KEY') || error.message?.includes('credentials')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your GOOGLE_GEMINI_API_KEY.', success: false },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.', success: false },
        { status: 429 }
      );
    }

    // Fallback to simple responses if AI fails
    console.log('Falling back to simple responses due to AI error:', error.message);
    
    if (parsedData) {
      const { messages } = parsedData;
      const userMessage = messages && messages.length > 0 
        ? messages[messages.length - 1]?.parts?.[0]?.text || ''
        : '';

      // Simple fallback response logic
      let fallbackResponse = '';
      
      if (userMessage.toLowerCase().includes('time') || userMessage.toLowerCase().includes('timing')) {
        fallbackResponse = "I can help you with timing! I track how long you spend on each slide. You can see your slide timings in the sidebar, and I can give you specific feedback about your pacing.";
      } else if (userMessage.toLowerCase().includes('slide') && userMessage.toLowerCase().includes('content')) {
        fallbackResponse = "I can see your presentation content and help you improve it. What specific aspect would you like me to focus on - clarity, flow, or structure?";
      } else if (userMessage.toLowerCase().includes('practice') || userMessage.toLowerCase().includes('improve')) {
        fallbackResponse = "Great question! I can help you practice by analyzing your timing, providing feedback on your content, and even referencing what you've said during practice sessions. What would you like to work on?";
      } else if (userMessage.toLowerCase().includes('transcript') || userMessage.toLowerCase().includes('said')) {
        fallbackResponse = "I can see your practice transcripts organized by slide! This helps me give you specific feedback about what you said and how you can improve your delivery.";
      } else if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
        fallbackResponse = "I'm here to help you practice your presentations! I can analyze your timing, review your content, provide feedback on your delivery, and help you improve. Just ask me anything about your presentation practice!";
      } else {
        fallbackResponse = "Hi! I'm Flo, your presentation practice coach. I can help you with timing analysis, content review, delivery feedback, and more. What would you like to work on today?";
      }

      return NextResponse.json({ 
        response: fallbackResponse,
        success: true 
      });
    }

    // If even the fallback fails, return a generic error
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.', success: false },
      { status: 500 }
    );
  }
} 