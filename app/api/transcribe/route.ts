import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google Cloud clients with base64 credentials
let speechClient: SpeechClient | null = null;
let storage: Storage | null = null;
let gcsBucketName: string | null = null;

function initializeClients() {
  if (speechClient && storage) {
    return;
  }

  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!credentialsBase64) {
    throw new Error('GOOGLE_CREDENTIALS_BASE64 environment variable is not set');
  }

  gcsBucketName = process.env.GCS_BUCKET_NAME || null;
  if (!gcsBucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is not set');
  }

  try {
    const decodedString = Buffer.from(credentialsBase64, 'base64').toString('utf8');
    const credentials = JSON.parse(decodedString);

    if (!credentials.type || !credentials.project_id) {
      throw new Error('Invalid service account key format');
    }
    
    speechClient = new SpeechClient({ credentials });
    storage = new Storage({ credentials });

  } catch (parseError) {
    console.error('Error parsing credentials:', parseError);
    if (parseError instanceof SyntaxError) {
      throw new Error('Invalid JSON in credentials. Please check your GOOGLE_CREDENTIALS_BASE64 format.');
    }
    throw new Error('Failed to decode credentials. Please check your GOOGLE_CREDENTIALS_BASE64.');
  }
}

async function transcribeWithGcs(audioData: string, slideNumber: number) {
  initializeClients();

  // The 'storage' and 'gcsBucketName' are guaranteed to be initialized here.
  // Using non-null assertion operator (!) as a type guard.
  const bucket = storage!.bucket(gcsBucketName!);

  const audioBuffer = Buffer.from(audioData, 'base64');
  const fileId = `${uuidv4()}.webm`;
  const file = bucket.file(fileId);

  await file.save(audioBuffer, {
    metadata: {
      contentType: 'audio/webm;codecs=opus',
    },
  });

  const gcsUri = `gs://${gcsBucketName}/${fileId}`;

  const request = {
    audio: {
      uri: gcsUri,
    },
    config: {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
    },
  };

  // The 'speechClient' is guaranteed to be initialized.
  const [operation] = await speechClient!.longRunningRecognize(request);
  
  return {
    operationName: operation.name,
    slideNumber,
    success: true,
    isAsync: true,
    gcsUri, // Return the URI for potential cleanup later
  };
}

export async function POST(req: NextRequest) {
  try {
    initializeClients();
    const { audioData, slideNumber } = await req.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'No audio data provided', success: false },
        { status: 400 }
      );
    }
    
    // Always use asynchronous transcription via GCS
    const result = await transcribeWithGcs(audioData, slideNumber);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Handle specific error cases
    if (error.message?.includes('credentials') || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: error.message || 'Invalid Google Cloud credentials. Please check your GOOGLE_CREDENTIALS_BASE64.', success: false },
        { status: 401 }
      );
    }

    if (error.message?.includes('GCS_BUCKET_NAME')) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
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