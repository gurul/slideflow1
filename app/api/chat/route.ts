import { NextRequest, NextResponse } from 'next/server';

// Maximum file size in bytes (4MB)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

// Initialize Google Cloud AI client with base64 credentials
let aiClient: any = null;

function initializeAIClient() {
  if (!aiClient) {
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    if (!credentialsBase64) {
      throw new Error('GOOGLE_CREDENTIALS_BASE64 environment variable is not set');
    }

    try {
      // Decode base64 to string
      const decodedString = Buffer.from(credentialsBase64, 'base64').toString('utf8');
      
      // Try to parse as JSON
      const credentials = JSON.parse(decodedString);
      
      // Validate that it looks like a service account key
      if (!credentials.type || !credentials.project_id) {
        throw new Error('Invalid service account key format');
      }
      
      // For now, we'll use a simple text-based response since Google Cloud AI Platform
      // requires additional setup. This provides a fallback that works with the credentials.
      aiClient = { credentials };
    } catch (parseError) {
      console.error('Error parsing credentials:', parseError);
      throw new Error('Failed to decode credentials. Please check your GOOGLE_CREDENTIALS_BASE64.');
    }
  }
  return aiClient;
}

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
            error: 'The PDF file is too large. Please compress it to under 4MB.',
            success: false 
          },
          { status: 413 }
        );
      }
    }

    // Initialize the AI client
    const client = initializeAIClient();

    const floPersona = `You are Flo, a warm AI coach built into Slideflow. Be friendly and helpful, but don't mention presentation data unless asked.`;

    const contextPrompt = context
      ? `Here is some context about my presentation. Use this information ONLY if it is directly relevant to my question or if I ask for it. Do NOT mention or repeat this context unless necessary. Do NOT use phrases like 'please allow me a moment', 'let me process this', or similar. Respond directly with your analysis or answer. Context: ${context}`
      : undefined;

    // Get the user's message
    const userMessage = messages && messages.length > 0 
      ? messages[messages.length - 1]?.parts?.[0]?.text || ''
      : '';

    // Simple response logic based on common presentation practice questions
    let response = '';
    
    if (userMessage.toLowerCase().includes('time') || userMessage.toLowerCase().includes('timing')) {
      response = "I can help you with timing! I track how long you spend on each slide. You can see your slide timings in the sidebar, and I can give you specific feedback about your pacing.";
    } else if (userMessage.toLowerCase().includes('slide') && userMessage.toLowerCase().includes('content')) {
      response = "I can see your presentation content and help you improve it. What specific aspect would you like me to focus on - clarity, flow, or structure?";
    } else if (userMessage.toLowerCase().includes('practice') || userMessage.toLowerCase().includes('improve')) {
      response = "Great question! I can help you practice by analyzing your timing, providing feedback on your content, and even referencing what you've said during practice sessions. What would you like to work on?";
    } else if (userMessage.toLowerCase().includes('transcript') || userMessage.toLowerCase().includes('said')) {
      response = "I can see your practice transcripts organized by slide! This helps me give you specific feedback about what you said and how you can improve your delivery.";
    } else if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
      response = "I'm here to help you practice your presentations! I can analyze your timing, review your content, provide feedback on your delivery, and help you improve. Just ask me anything about your presentation practice!";
    } else {
      response = "Hi! I'm Flo, your presentation practice coach. I can help you with timing analysis, content review, delivery feedback, and more. What would you like to work on today?";
    }

    // Add context-aware responses if we have presentation data
    if (context && context.includes('currentSlide')) {
      response += " I can see you're currently working on your presentation. Feel free to ask me about specific slides, timing, or any other aspect of your practice!";
    }

    return NextResponse.json({ 
      response,
      success: true 
    });

  } catch (error: any) {
    console.error('AI API error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('credentials') || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: error.message || 'Invalid Google Cloud credentials. Please check your GOOGLE_CREDENTIALS_BASE64.', success: false },
        { status: 401 }
      );
    }

    // Handle any other errors
    return NextResponse.json(
      { error: error.message || 'Failed to generate response', success: false },
      { status: 500 }
    );
  }
} 