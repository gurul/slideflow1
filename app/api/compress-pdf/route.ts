import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Generate JWT token for IlovePDF API
const generateIlovePDFToken = () => {
  const secretKey = process.env.ILOVEPDF_SECRET_KEY;
  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  
  if (!secretKey || !publicKey) {
    throw new Error('ILOVEPDF_SECRET_KEY and ILOVEPDF_PUBLIC_KEY environment variables are required');
  }

  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: publicKey,
    sub: publicKey,
    aud: 'https://api.ilovepdf.com/v1',
    iat: now,
    nbf: now,
    exp: now + (2 * 60 * 60), // 2 hours expiration
  };

  return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
};

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, compressionLevel = 'extreme' } = await req.json();

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF base64 data is required', success: false },
        { status: 400 }
      );
    }

    // Generate JWT token for authentication
    const token = generateIlovePDFToken();
    console.log('Generated JWT token for IlovePDF API');

    // Step 1: Start the task
    console.log('Starting IlovePDF compression task...');
    const startResponse = await fetch('https://api.ilovepdf.com/v1/start/compress', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`IlovePDF start error: ${startResponse.status} - ${errorText}`);
    }

    const startData = await startResponse.json();
    const { server, task } = startData;
    
    console.log(`Task started on server: ${server}, task ID: ${task}`);

    // Step 2: Upload the file
    console.log('Uploading PDF file...');
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    
    const formData = new FormData();
    formData.append('task', task);
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'document.pdf');

    const uploadResponse = await fetch(`https://${server}/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`IlovePDF upload error: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const { server_filename } = uploadData;
    
    console.log(`File uploaded with server filename: ${server_filename}`);

    // Step 3: Process the file
    console.log('Processing PDF compression...');
    const processResponse = await fetch(`https://${server}/v1/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: task,
        tool: 'compress',
        files: [{
          server_filename: server_filename,
          filename: 'document.pdf'
        }],
        compression_level: compressionLevel,
      }),
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      throw new Error(`IlovePDF process error: ${processResponse.status} - ${errorText}`);
    }

    const processData = await processResponse.json();
    console.log(`Processing completed with status: ${processData.status}`);

    // Step 4: Download the result
    console.log('Downloading compressed PDF...');
    const downloadResponse = await fetch(`https://${server}/v1/download/${task}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      throw new Error(`IlovePDF download error: ${downloadResponse.status} - ${errorText}`);
    }

    // Get the compressed PDF as array buffer
    const compressedBuffer = await downloadResponse.arrayBuffer();
    const compressedBase64 = Buffer.from(compressedBuffer).toString('base64');
    
    console.log(`IlovePDF compression completed: ${compressionLevel} level`);
    console.log(`Original size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed size: ${(compressedBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    return NextResponse.json({
      success: true,
      compressedBase64,
      compressionLevel,
      originalSize: pdfBuffer.length,
      compressedSize: compressedBuffer.byteLength,
    });

  } catch (error: any) {
    console.error('IlovePDF compression error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to compress PDF with IlovePDF',
        success: false 
      },
      { status: 500 }
    );
  }
} 