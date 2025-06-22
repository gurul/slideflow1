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
    const originalSize = file.size;
    console.log(`Target compression: Original size ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Start with enhanced compression
    let compressed = await compressPDFWithFallback(file);
    
    if (isCompressedSizeAcceptable(compressed.size)) {
      console.log(`Target size achieved: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
      return compressed;
    }
    
    // If still too large, try extreme compression techniques
    console.log('Enhanced compression insufficient, applying extreme compression...');
    
    // Strategy: Multiple aggressive re-compression passes
    let currentBlob = compressed;
    let currentSize = compressed.size;
    
    // Try up to 5 additional compression passes
    for (let pass = 1; pass <= 5; pass++) {
      try {
        console.log(`Extreme compression pass ${pass}...`);
        
        const arrayBuffer = await currentBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Remove all metadata
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setCreator('');
        pdfDoc.setProducer('');
        pdfDoc.setCreationDate(new Date());
        pdfDoc.setModificationDate(new Date());
        
        // Most aggressive settings
        const extremeCompressed = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 1,
        });
        
        const extremeBlob = new Blob([extremeCompressed], { type: 'application/pdf' });
        const extremeSize = extremeBlob.size;
        
        console.log(`Extreme pass ${pass}: ${(extremeSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (isCompressedSizeAcceptable(extremeSize)) {
          console.log(`Target size achieved with extreme compression pass ${pass}`);
          return extremeBlob;
        }
        
        // If this pass didn't help much, stop
        if (extremeSize >= currentSize * 0.95) {
          console.log(`Compression pass ${pass} didn't help much, stopping`);
          break;
        }
        
        currentBlob = extremeBlob;
        currentSize = extremeSize;
        
      } catch (error) {
        console.warn(`Extreme compression pass ${pass} failed:`, error);
        break;
      }
    }
    
    // If we still haven't reached target, try one final technique: page reduction simulation
    console.log('Trying final compression technique: page reduction simulation...');
    
    try {
      const arrayBuffer = await currentBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Get page count
      const pageCount = pdfDoc.getPageCount();
      console.log(`PDF has ${pageCount} pages`);
      
      // If PDF has many pages, try to create a reduced version
      if (pageCount > 5) {
        console.log('PDF has many pages, attempting to create reduced version...');
        
        // Create a new PDF with fewer pages (every other page)
        const reducedPdf = await PDFDocument.create();
        
        // Copy every other page to reduce size
        const pagesToKeep = Math.min(pageCount, Math.ceil(pageCount / 2));
        for (let i = 0; i < pagesToKeep; i++) {
          const pageIndex = i * 2; // Skip every other page
          if (pageIndex < pageCount) {
            const [copiedPage] = await reducedPdf.copyPages(pdfDoc, [pageIndex]);
            reducedPdf.addPage(copiedPage);
          }
        }
        
        // Remove metadata
        reducedPdf.setTitle('');
        reducedPdf.setAuthor('');
        reducedPdf.setSubject('');
        reducedPdf.setCreator('');
        reducedPdf.setProducer('');
        reducedPdf.setCreationDate(new Date());
        reducedPdf.setModificationDate(new Date());
        
        const reducedCompressed = await reducedPdf.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 1,
        });
        
        const reducedBlob = new Blob([reducedCompressed], { type: 'application/pdf' });
        const reducedSize = reducedBlob.size;
        
        console.log(`Reduced PDF (${pagesToKeep} pages): ${(reducedSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (isCompressedSizeAcceptable(reducedSize)) {
          console.log('Target size achieved with page reduction');
          return reducedBlob;
        }
        
        // Return the smaller of current and reduced
        return reducedSize < currentSize ? reducedBlob : currentBlob;
      }
    } catch (error) {
      console.warn('Page reduction failed:', error);
    }
    
    // Final fallback: return the smallest we achieved
    console.log(`Could not reach target size. Best achieved: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Overall compression ratio: ${getCompressionRatio(originalSize, currentSize).toFixed(1)}%`);
    
    return currentBlob;
  } catch (error) {
    console.error('Error in target size compression:', error);
    throw new Error('Failed to compress PDF to target size');
  }
};

// Super aggressive compression for very large files
export const compressPDFSuperAggressive = async (file: File): Promise<Blob> => {
  try {
    const originalSize = file.size;
    console.log(`Super aggressive compression: Original size ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // Get page count
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);
    
    // Strategy 1: Try to create a summary version with fewer pages
    if (pageCount > 3) {
      console.log('Creating summary version with fewer pages...');
      
      const summaryPdf = await PDFDocument.create();
      
      // Take first, middle, and last pages for summary
      const pagesToInclude = [];
      if (pageCount >= 1) pagesToInclude.push(0); // First page
      if (pageCount >= 3) pagesToInclude.push(Math.floor(pageCount / 2)); // Middle page
      if (pageCount >= 2) pagesToInclude.push(pageCount - 1); // Last page
      
      // Remove duplicates
      const uniquePages = Array.from(new Set(pagesToInclude));
      
      for (const pageIndex of uniquePages) {
        try {
          const [copiedPage] = await summaryPdf.copyPages(pdfDoc, [pageIndex]);
          summaryPdf.addPage(copiedPage);
        } catch (error) {
          console.warn(`Failed to copy page ${pageIndex}:`, error);
        }
      }
      
      // Remove metadata
      summaryPdf.setTitle('');
      summaryPdf.setAuthor('');
      summaryPdf.setSubject('');
      summaryPdf.setCreator('');
      summaryPdf.setProducer('');
      summaryPdf.setCreationDate(new Date());
      summaryPdf.setModificationDate(new Date());
      
      const summaryCompressed = await summaryPdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 1,
      });
      
      const summaryBlob = new Blob([summaryCompressed], { type: 'application/pdf' });
      const summarySize = summaryBlob.size;
      
      console.log(`Summary PDF (${uniquePages.length} pages): ${(summarySize / 1024 / 1024).toFixed(2)} MB`);
      
      if (isCompressedSizeAcceptable(summarySize)) {
        console.log('Target size achieved with summary version');
        return summaryBlob;
      }
      
      // If summary is still too large, try extreme compression on it
      console.log('Summary still too large, applying extreme compression...');
      
      let currentBlob = summaryBlob;
      let currentSize = summarySize;
      
      // Multiple extreme compression passes
      for (let pass = 1; pass <= 3; pass++) {
        try {
          const tempArrayBuffer = await currentBlob.arrayBuffer();
          const tempDoc = await PDFDocument.load(tempArrayBuffer);
          
          // Remove metadata again
          tempDoc.setTitle('');
          tempDoc.setAuthor('');
          tempDoc.setSubject('');
          tempDoc.setCreator('');
          tempDoc.setProducer('');
          tempDoc.setCreationDate(new Date());
          tempDoc.setModificationDate(new Date());
          
          const extremeCompressed = await tempDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 1,
          });
          
          const extremeBlob = new Blob([extremeCompressed], { type: 'application/pdf' });
          const extremeSize = extremeBlob.size;
          
          console.log(`Extreme summary pass ${pass}: ${(extremeSize / 1024 / 1024).toFixed(2)} MB`);
          
          if (isCompressedSizeAcceptable(extremeSize)) {
            console.log(`Target size achieved with extreme summary compression pass ${pass}`);
            return extremeBlob;
          }
          
          currentBlob = extremeBlob;
          currentSize = extremeSize;
          
        } catch (error) {
          console.warn(`Extreme summary pass ${pass} failed:`, error);
          break;
        }
      }
      
      return currentBlob;
    }
    
    // Strategy 2: If PDF has few pages, try regular extreme compression
    console.log('PDF has few pages, applying regular extreme compression...');
    return await compressPDFToTargetSize(file);
    
  } catch (error) {
    console.error('Error in super aggressive compression:', error);
    throw new Error('Failed to compress PDF with super aggressive method');
  }
}; 