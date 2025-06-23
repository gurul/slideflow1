import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';

// Initialize Google Cloud Speech client with base64 credentials
let speechClient: SpeechClient | null = null;

function initializeSpeechClient() {
  if (!speechClient) {
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
      
      speechClient = new SpeechClient({ credentials });
    } catch (parseError) {
      console.error('Error parsing credentials:', parseError);
      throw new Error('Failed to decode credentials. Please check your GOOGLE_CREDENTIALS_BASE64.');
    }
  }
  return speechClient;
}

export async function POST(req: NextRequest) {
  try {
    const { operationName, slideNumber } = await req.json();

    if (!operationName) {
      return NextResponse.json(
        { error: 'No operation name provided', success: false },
        { status: 400 }
      );
    }

    const client = initializeSpeechClient();

    // Check the operation status
    const operation = await client.checkLongRunningRecognizeProgress(operationName);

    if (!operation.done) {
      // Operation is still running
      return NextResponse.json({
        status: 'RUNNING',
        slideNumber,
        success: true,
        message: 'Transcription is still in progress'
      });
    }

    // Operation is complete, get the results
    const response = operation.result as any;
    
    if (!response || !response.results || response.results.length === 0) {
      return NextResponse.json({
        status: 'COMPLETED',
        transcript: '',
        slideNumber,
        success: true,
        message: 'No speech detected'
      });
    }

    // Extract the transcript
    const transcript = response.results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    return NextResponse.json({
      status: 'COMPLETED',
      transcript,
      slideNumber,
      success: true
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('credentials') || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: error.message || 'Invalid Google Cloud credentials. Please check your GOOGLE_CREDENTIALS_BASE64.', success: false },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Google Cloud Speech-to-Text quota exceeded. Please try again later.', success: false },
        { status: 429 }
      );
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Transcription operation not found or expired', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to check transcription status', success: false },
      { status: 500 }
    );
  }
} 