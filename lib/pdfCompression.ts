import { PDFDocument } from 'pdf-lib';

// Target maximum file size (4MB)
const TARGET_MAX_SIZE = 4 * 1024 * 1024; // 4MB in bytes

export const compressPDF = async (file: File): Promise<Blob> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Remove metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // Save with aggressive compression settings
    const compressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 20,
    });
    
    return new Blob([compressed], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error compressing PDF:', error);
    throw new Error('Failed to compress PDF file');
  }
};

export const compressPDFToBase64 = async (file: File): Promise<string> => {
  try {
    const compressedBlob = await compressPDF(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to convert compressed PDF to base64'));
      reader.readAsDataURL(compressedBlob);
    });
  } catch (error) {
    console.error('Error converting compressed PDF to base64:', error);
    throw error;
  }
};

// Check if file size is too large (e.g., > 10MB)
export const isFileTooLarge = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
};

// Get file size in MB
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

// Get compression ratio
export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return ((originalSize - compressedSize) / originalSize) * 100;
};

// Check if compressed size meets target
export const isCompressedSizeAcceptable = (compressedSize: number): boolean => {
  return compressedSize <= TARGET_MAX_SIZE;
};

// Enhanced compression with multiple attempts to reach target size
export const compressPDFWithFallback = async (file: File): Promise<Blob> => {
  try {
    const originalSize = file.size;
    console.log(`Original file size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Strategy 1: Standard compression
    console.log('Applying standard compression...');
    const compressed = await compressPDF(file);
    const compressedSize = compressed.size;
    console.log(`Standard compression: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (isCompressedSizeAcceptable(compressedSize)) {
      console.log('Target size achieved with standard compression');
      return compressed;
    }
    
    // Strategy 2: Aggressive compression
    console.log('Standard compression insufficient, applying aggressive compression...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Remove all metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // More aggressive compression settings
    const aggressiveCompressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 5, // Lower value for more aggressive processing
    });
    
    const aggressiveBlob = new Blob([aggressiveCompressed], { type: 'application/pdf' });
    const aggressiveSize = aggressiveBlob.size;
    console.log(`Aggressive compression: ${(aggressiveSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (isCompressedSizeAcceptable(aggressiveSize)) {
      console.log('Target size achieved with aggressive compression');
      return aggressiveBlob;
    }
    
    // Strategy 3: Ultra-aggressive compression with page reduction simulation
    console.log('Aggressive compression insufficient, applying ultra-aggressive compression...');
    
    // Try to reduce quality by re-saving multiple times
    let ultraCompressed = aggressiveCompressed;
    let ultraSize = aggressiveSize;
    
    // Multiple compression passes
    for (let pass = 1; pass <= 3; pass++) {
      try {
        const tempDoc = await PDFDocument.load(ultraCompressed);
        
        // Remove metadata again
        tempDoc.setTitle('');
        tempDoc.setAuthor('');
        tempDoc.setSubject('');
        tempDoc.setCreator('');
        tempDoc.setProducer('');
        tempDoc.setCreationDate(new Date());
        tempDoc.setModificationDate(new Date());
        
        ultraCompressed = await tempDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 1, // Most aggressive setting
        });
        
        ultraSize = ultraCompressed.length;
        console.log(`Ultra-compression pass ${pass}: ${(ultraSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (isCompressedSizeAcceptable(ultraSize)) {
          console.log(`Target size achieved with ultra-compression pass ${pass}`);
          return new Blob([ultraCompressed], { type: 'application/pdf' });
        }
      } catch (error) {
        console.warn(`Ultra-compression pass ${pass} failed:`, error);
        break;
      }
    }
    
    // If we still haven't reached target size, return the smallest result
    const smallestSize = Math.min(compressedSize, aggressiveSize, ultraSize);
    const smallestBlob = smallestSize === compressedSize ? compressed :
                        smallestSize === aggressiveSize ? aggressiveBlob :
                        new Blob([ultraCompressed], { type: 'application/pdf' });
    
    console.log(`Could not reach target size. Smallest achieved: ${(smallestSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compression ratio: ${getCompressionRatio(originalSize, smallestSize).toFixed(1)}%`);
    
    return smallestBlob;
  } catch (error) {
    console.error('Error in enhanced compression:', error);
    throw new Error('Failed to compress PDF file');
  }
};

// Force compression to target size (may reduce quality significantly)
export const compressPDFToTargetSize = async (file: File): Promise<Blob> => {
  try {
    const compressed = await compressPDFWithFallback(file);
    
    if (isCompressedSizeAcceptable(compressed.size)) {
      return compressed;
    }
    
    // If still too large, try extreme compression
    console.log('File still too large, applying extreme compression...');
    
    const arrayBuffer = await compressed.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Remove all possible metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setCreator('');
    pdfDoc.setProducer('');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // Extreme compression settings
    const extremeCompressed = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 1,
    });
    
    const extremeBlob = new Blob([extremeCompressed], { type: 'application/pdf' });
    console.log(`Extreme compression: ${(extremeBlob.size / 1024 / 1024).toFixed(2)} MB`);
    
    return extremeBlob;
  } catch (error) {
    console.error('Error in target size compression:', error);
    throw new Error('Failed to compress PDF to target size');
  }
}; 