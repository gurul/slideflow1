import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (!credentialsBase64) {
      return NextResponse.json({
        error: 'GOOGLE_CREDENTIALS_BASE64 environment variable is not set',
        success: false
      });
    }

    // Test base64 decoding
    try {
      const decodedString = Buffer.from(credentialsBase64, 'base64').toString('utf8');
      
      // Test JSON parsing
      const credentials = JSON.parse(decodedString);
      
      // Check for required fields
      const hasType = !!credentials.type;
      const hasProjectId = !!credentials.project_id;
      const hasPrivateKey = !!credentials.private_key;
      const hasClientEmail = !!credentials.client_email;
      
      return NextResponse.json({
        success: true,
        message: 'Credentials are valid',
        details: {
          hasType,
          hasProjectId,
          hasPrivateKey,
          hasClientEmail,
          projectId: credentials.project_id,
          type: credentials.type,
          base64Length: credentialsBase64.length
        }
      });
      
    } catch (parseError) {
      return NextResponse.json({
        error: 'Failed to parse credentials',
        details: {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
          base64Length: credentialsBase64.length,
          base64Preview: credentialsBase64.substring(0, 50) + '...'
        },
        success: false
      });
    }
    
  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
} 