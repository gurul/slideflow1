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
      console.error('Base64 length:', credentialsBase64.length);
      console.error('First 100 chars of base64:', credentialsBase64.substring(0, 100));
      
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON in credentials. Please check your GOOGLE_CREDENTIALS_BASE64 format.');
      }
      throw new Error('Failed to decode credentials. Please check your GOOGLE_CREDENTIALS_BASE64.');
    }
  }
  return speechClient;
}

export async function POST(req: NextRequest) {
  try {
    const { audioData, slideNumber } = await req.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided', success: false },
        { status: 400 }
      );
    }

    // Initialize the speech client
    const client = initializeSpeechClient();

    // Configure the recognition request
    const request = {
      audio: {
        content: audioData, // Send as base64
      },
      config: {
        encoding: 'WEBM_OPUS' as const, // Adjust based on your audio format
        sampleRateHertz: 48000, // Adjust based on your audio sample rate
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        enableWordConfidence: false,
        model: 'latest_long', // Best for longer audio segments
      },
    };

    // Perform the transcription
    const [response] = await client.recognize(request);
    
    if (!response.results || response.results.length === 0) {
      return NextResponse.json({
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
      transcript,
      slideNumber,
      success: true
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    
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

    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio', success: false },
      { status: 500 }
    );
  }
} 