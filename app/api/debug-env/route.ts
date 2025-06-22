import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    return NextResponse.json({
      success: true,
      environment: {
        hasGeminiKey: !!geminiKey,
        geminiKeyLength: geminiKey ? geminiKey.length : 0,
        geminiKeyPreview: geminiKey ? `${geminiKey.substring(0, 10)}...` : 'not set',
        hasCredentials: !!credentialsBase64,
        credentialsLength: credentialsBase64 ? credentialsBase64.length : 0,
        credentialsPreview: credentialsBase64 ? `${credentialsBase64.substring(0, 20)}...` : 'not set',
        nodeEnv: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
} 