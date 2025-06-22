# PDF Compression Utility

This module provides PDF compression functionality to handle large files before sending them to AI services.

## Features

- **Target Size Compression**: Compresses PDF files to under 4MB for AI processing
- **Automatic Compression**: Compresses PDF files to reduce size before AI processing
- **Metadata Removal**: Removes unnecessary metadata to reduce file size
- **Multi-Strategy Compression**: Uses multiple compression strategies for optimal results
- **Size Validation**: Checks file sizes and provides compression ratios
- **Error Handling**: Comprehensive error handling for compression failures

## Functions

### `compressPDF(file: File): Promise<Blob>`
Basic PDF compression that removes metadata and applies standard compression settings.

### `compressPDFToBase64(file: File): Promise<string>`
Compresses a PDF and converts it to base64 string format.

### `compressPDFWithFallback(file: File): Promise<Blob>`
Enhanced compression that tries multiple strategies and returns the best result.

### `compressPDFToTargetSize(file: File): Promise<Blob>`
Forces compression to target size (4MB) using multiple aggressive strategies.

### `isFileTooLarge(file: File, maxSizeMB?: number): boolean`
Checks if a file exceeds the specified size limit (default: 10MB).

### `isCompressedSizeAcceptable(compressedSize: number): boolean`
Checks if the compressed size meets the target (4MB).

### `getFileSizeInMB(file: File): number`
Returns the file size in megabytes.

### `getCompressionRatio(originalSize: number, compressedSize: number): number`
Calculates the compression ratio as a percentage.

## Usage

```typescript
import { compressPDFToTargetSize, getFileSizeInMB } from '@/lib/pdfCompression';

// Compress a PDF file to under 4MB
const file = event.target.files[0];
const originalSize = getFileSizeInMB(file);
console.log(`Original size: ${originalSize.toFixed(2)} MB`);

const compressedBlob = await compressPDFToTargetSize(file);
const compressedSize = compressedBlob.size / (1024 * 1024);
console.log(`Compressed size: ${compressedSize.toFixed(2)} MB`);

// Check if compression was successful
if (compressedSize > 4) {
  console.error('File could not be compressed to under 4MB');
}
```

## Compression Strategy

1. **Standard Compression**: Removes metadata and applies basic compression
2. **Aggressive Compression**: If standard compression doesn't reach target, applies more aggressive settings
3. **Ultra-Aggressive Compression**: Multiple compression passes with most aggressive settings
4. **Extreme Compression**: Final attempt with extreme settings if needed

## Target Size

The compression utility targets a maximum file size of **4MB** to ensure compatibility with AI services.

## Error Handling

The module includes comprehensive error handling for:
- Invalid PDF files
- Compression failures
- File reading errors
- Base64 conversion errors
- Target size not achieved

## Dependencies

- `pdf-lib`: For PDF manipulation and compression 