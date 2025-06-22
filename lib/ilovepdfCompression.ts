import ILovePDF from '@ilovepdf/ilovepdf-js';

// Target maximum file size (4MB)
const TARGET_MAX_SIZE = 4 * 1024 * 1024; // 4MB in bytes

// Initialize IlovePDF with API key
const getIlovePDFInstance = () => {
  const apiKey = process.env.ILOVEPDF_API_KEY;
  if (!apiKey) {
    throw new Error('ILOVEPDF_API_KEY environment variable is not set');
  }
  return new ILovePDF(apiKey);
};

// Convert File to Buffer
const fileToBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

// Convert Buffer to Blob
const bufferToBlob = (buffer: Buffer, mimeType: string = 'application/pdf'): Blob => {
  return new Blob([buffer], { type: mimeType });
};

// Compress PDF using IlovePDF API via server-side endpoint
export const compressPDFWithIlovePDF = async (file: File): Promise<Blob> => {
  try {
    console.log(`IlovePDF compression: Original size ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Convert file to base64 for API transmission
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert file to base64'));
      reader.readAsDataURL(file);
    });
    
    // Call our server-side IlovePDF endpoint
    const response = await fetch('/api/compress-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: base64,
        compressionLevel: 'extreme',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `IlovePDF API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'IlovePDF compression failed');
    }
    
    // Convert base64 result back to blob
    const compressedBuffer = Buffer.from(result.compressedBase64, 'base64');
    const compressedBlob = bufferToBlob(compressedBuffer);
    
    console.log(`IlovePDF compression result: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression ratio: ${((file.size - compressedBlob.size) / file.size * 100).toFixed(1)}%`);
    
    return compressedBlob;
  } catch (error) {
    console.error('Error in IlovePDF compression:', error);
    throw new Error('Failed to compress PDF with IlovePDF API');
  }
};

// Compress PDF to target size using IlovePDF
export const compressPDFToTargetSizeWithIlovePDF = async (file: File): Promise<Blob> => {
  try {
    const originalSize = file.size;
    console.log(`IlovePDF target compression: Original size ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Try extreme compression first
    let compressed = await compressPDFWithIlovePDF(file);
    let compressedSize = compressed.size;
    
    console.log(`IlovePDF extreme compression: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (isCompressedSizeAcceptable(compressedSize)) {
      console.log('Target size achieved with IlovePDF extreme compression');
      return compressed;
    }
    
    // If still too large, try with different compression levels
    const compressionLevels = ['recommended', 'low'];
    
    for (const level of compressionLevels) {
      try {
        console.log(`Trying IlovePDF compression level: ${level}`);
        
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('Failed to convert file to base64'));
          reader.readAsDataURL(file);
        });
        
        // Call server-side endpoint
        const response = await fetch('/api/compress-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfBase64: base64,
            compressionLevel: level,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `IlovePDF API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'IlovePDF compression failed');
        }
        
        // Convert base64 result back to blob
        const compressedBuffer = Buffer.from(result.compressedBase64, 'base64');
        const levelCompressed = bufferToBlob(compressedBuffer);
        const levelSize = levelCompressed.size;
        
        console.log(`IlovePDF ${level} compression: ${(levelSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (isCompressedSizeAcceptable(levelSize)) {
          console.log(`Target size achieved with IlovePDF ${level} compression`);
          return levelCompressed;
        }
        
        // Keep the smallest result
        if (levelSize < compressedSize) {
          compressed = levelCompressed;
          compressedSize = levelSize;
        }
      } catch (error) {
        console.warn(`IlovePDF ${level} compression failed:`, error);
      }
    }
    
    console.log(`IlovePDF best achieved: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    return compressed;
    
  } catch (error) {
    console.error('Error in IlovePDF target compression:', error);
    throw new Error('Failed to compress PDF to target size with IlovePDF');
  }
};

// Convert compressed blob to base64
export const compressPDFToBase64WithIlovePDF = async (file: File): Promise<string> => {
  try {
    const compressedBlob = await compressPDFToTargetSizeWithIlovePDF(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert compressed PDF to base64'));
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    console.error('Error converting IlovePDF compressed PDF to base64:', error);
    throw error;
  }
};

// Check if compressed size meets target
export const isCompressedSizeAcceptable = (compressedSize: number): boolean => {
  return compressedSize <= TARGET_MAX_SIZE;
};

// Get file size in MB
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

// Get compression ratio
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return ((originalSize - compressedSize) / originalSize) * 100;
}; 