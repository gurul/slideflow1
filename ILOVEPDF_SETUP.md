# IlovePDF API Setup

This project now uses IlovePDF API for better PDF compression capabilities. IlovePDF provides more powerful compression than client-side libraries.

## Setup Instructions

### 1. Get IlovePDF API Credentials

1. Go to [IlovePDF API](https://developer.ilovepdf.com/)
2. Sign up for a free account
3. Create a new project in your dashboard
4. Get your **Project Public Key** and **Project Secret Key**
5. Note: Free tier includes 250 API calls per month

### 2. Add API Credentials to Environment

Add your IlovePDF credentials to your `.env.local` file:

```bash
# Add these lines to your .env.local file
ILOVEPDF_PUBLIC_KEY=your_project_public_key_here
ILOVEPDF_SECRET_KEY=your_project_secret_key_here
```

**Important**: 
- Use the **Project Public Key** (not the API key)
- Use the **Project Secret Key** for JWT signing
- Never expose these keys in client-side code

### 3. Restart Development Server

After adding the credentials, restart your development server:

```bash
npm run dev
```

## How It Works

1. **JWT Authentication**: Generates secure JWT tokens for API access
2. **4-Step Process**: Start → Upload → Process → Download
3. **Professional Compression**: Server-side compression with multiple levels
4. **Fallback**: If IlovePDF fails, falls back to client-side compression
5. **Target Size**: Ensures files are compressed to under 4MB

## Compression Levels

- **Extreme**: Maximum compression (default)
- **Recommended**: Balanced compression  
- **Low**: Minimal compression
- **Client-side fallback**: Uses pdf-lib for local compression

## API Workflow

1. **Start**: Get server and task ID from IlovePDF
2. **Upload**: Upload PDF file to assigned server
3. **Process**: Apply compression with specified level
4. **Download**: Retrieve compressed PDF

## Error Handling

- If IlovePDF API is unavailable, automatically falls back to client-side compression
- Clear error messages for users
- Logging for debugging compression issues
- JWT token expiration handling

## API Endpoints

- `/api/compress-pdf`: Server-side IlovePDF compression endpoint
- Accepts PDF as base64 and compression level
- Returns compressed PDF as base64 with size information

## Benefits

- **Better Compression**: IlovePDF can achieve 50-80% size reduction
- **Professional Quality**: Uses enterprise-grade compression algorithms
- **Reliable**: Server-side processing with fallback options
- **Fast**: Optimized for large files
- **Secure**: JWT-based authentication

## Troubleshooting

### API Credentials Issues
- Ensure `ILOVEPDF_PUBLIC_KEY` and `ILOVEPDF_SECRET_KEY` are set in `.env.local`
- Check that the credentials are valid and have remaining quota
- Restart the development server after adding credentials
- Verify you're using Project keys, not API keys

### Compression Failures
- Check browser console for detailed error messages
- Verify PDF file is valid and not corrupted
- Try with a smaller PDF file first
- Check IlovePDF dashboard for API usage and errors

### Rate Limiting
- Free tier: 250 API calls per month
- Consider upgrading for higher usage
- Client-side fallback handles rate limit issues

### JWT Token Issues
- Tokens expire after 2 hours
- Check system clock synchronization
- Verify secret key is correct

## Security Notes

- **Never expose secret keys** in client-side code
- JWT tokens are generated server-side only
- All API communication is over HTTPS
- Files are processed securely on IlovePDF servers 