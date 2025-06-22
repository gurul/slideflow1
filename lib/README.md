# PDF Compression Utility

This module provides PDF compression functionality to handle large files before sending them to AI services.

## Features

- **Automatic Compression**: Compresses PDF files to reduce size before AI processing
- **Metadata Removal**: Removes unnecessary metadata to reduce file size
- **Fallback Compression**: Uses multiple compression strategies for optimal results
- **Size Validation**: Checks file sizes and provides compression ratios
- **Error Handling**: Comprehensive error handling for compression failures

## Functions

### `compressPDF(file: File): Promise<Blob>`
Basic PDF compression that removes metadata and applies standard compression settings.

### `compressPDFToBase64(file: File): Promise<string>`
Compresses a PDF and converts it to base64 string format.

### `compressPDFWithFallback(file: File): Promise<Blob>`
Enhanced compression that tries multiple strategies and returns the best result.

### `isFileTooLarge(file: File, maxSizeMB?: number): boolean`
Checks if a file exceeds the specified size limit (default: 10MB).

### `getFileSizeInMB(file: File): number`
Returns the file size in megabytes.

### `getCompressionRatio(originalSize: number, compressedSize: number): number`
Calculates the compression ratio as a percentage.

## Usage

```typescript
import { compressPDFWithFallback, getFileSizeInMB } from '@/lib/pdfCompression';

// Compress a PDF file
const file = event.target.files[0];
const originalSize = getFileSizeInMB(file);
console.log(`Original size: ${originalSize.toFixed(2)} MB`);

const compressedBlob = await compressPDFWithFallback(file);
const compressedSize = compressedBlob.size / (1024 * 1024);
console.log(`Compressed size: ${compressedSize.toFixed(2)} MB`);
```

## Compression Strategy

1. **Standard Compression**: Removes metadata and applies basic compression
2. **Aggressive Compression**: If standard compression doesn't help much, applies more aggressive settings
3. **Size Comparison**: Returns the smaller of the two compressed versions

## Error Handling

The module includes comprehensive error handling for:
- Invalid PDF files
- Compression failures
- File reading errors
- Base64 conversion errors

## Dependencies

- `pdf-lib`: For PDF manipulation and compression 