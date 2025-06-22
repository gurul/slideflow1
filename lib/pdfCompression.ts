import { PDFDocument } from 'pdf-lib';

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

// Enhanced compression with multiple attempts
export const compressPDFWithFallback = async (file: File): Promise<Blob> => {
  try {
    // First attempt: standard compression
    const compressed = await compressPDF(file);
    const originalSize = file.size;
    const compressedSize = compressed.size;
    
    console.log(`Compression results: ${originalSize} -> ${compressedSize} bytes`);
    console.log(`Compression ratio: ${getCompressionRatio(originalSize, compressedSize).toFixed(1)}%`);
    
    // If compression didn't help much, try more aggressive settings
    if (compressedSize > originalSize * 0.9) { // If compressed size is > 90% of original
      console.log('Standard compression didn\'t help much, trying more aggressive compression...');
      
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
      
      // More aggressive compression
      const aggressiveCompressed = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 10,
      });
      
      const aggressiveBlob = new Blob([aggressiveCompressed], { type: 'application/pdf' });
      const aggressiveSize = aggressiveBlob.size;
      console.log(`Aggressive compression: ${originalSize} -> ${aggressiveSize} bytes`);
      console.log(`Aggressive compression ratio: ${getCompressionRatio(originalSize, aggressiveSize).toFixed(1)}%`);
      
      // Return the smaller of the two
      return aggressiveSize < compressedSize ? aggressiveBlob : compressed;
    }
    
    return compressed;
  } catch (error) {
    console.error('Error in enhanced compression:', error);
    throw new Error('Failed to compress PDF file');
  }
}; 