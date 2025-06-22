# File Upload Utility

This module handles PDF file uploads with simple size validation.

## Features

- **File Size Validation**: Checks if PDF files are under 4MB before processing
- **Clear Error Messages**: Provides user-friendly error messages for oversized files
- **Simple Upload Process**: Direct file upload without complex compression

## File Size Requirements

- **Maximum Size**: 4MB
- **Format**: PDF only
- **Validation**: Checked immediately upon file selection

## Usage

```typescript
// Simple file size check
const file = event.target.files[0];
const fileSizeMB = file.size / (1024 * 1024);

if (fileSizeMB > 4) {
  console.error(`File is too large (${fileSizeMB.toFixed(2)} MB). Please upload a file smaller than 4MB.`);
  return;
}

// Process the file normally
// ... upload and process logic
```

## Error Handling

The module provides clear error messages for:
- Files larger than 4MB
- Invalid file formats
- Upload failures

## User Guidance

When files are too large, users are advised to:
- Compress the PDF using their PDF software
- Reduce the number of pages
- Use a different, smaller file

## Target Size

The upload utility enforces a maximum file size of **4MB** to ensure compatibility with AI services. 