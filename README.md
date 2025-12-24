# SlideFlow

A simple presentation rehearsal tool for tracking slide timing and reviewing what you say while presenting.

## Overview

SlideFlow lets you upload a presentation PDF, practice your delivery, and review basic timing and speech data. It records how long you spend on each slide and generates slide-by-slide transcripts so you can reflect and improve.

## Features

- **Per-Slide Timing**: Automatically tracks time spent on each slide to help balance pacing
- **Speech Transcription**: Uses Google Cloud Speech-to-Text to transcribe your voice accurately, even for longer recordings
- **Slide-Aware Transcripts**: Transcripts are segmented by slide number for easy review
- **Export Options**: Download transcripts as `.txt` or `.md` files
- **Automatic Cleanup**: Audio files are automatically deleted after transcription to ensure privacy

## Live Demo

[Try the Live Demo](https://slideflow1.vercel.app/)

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js (API Routes), Google Cloud Storage
- **AI Services**: Google Cloud Speech-to-Text

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see configuration section)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

The application requires Google Cloud credentials for speech transcription. Set up the `GOOGLE_CREDENTIALS_BASE64` environment variable with your Google Cloud service account credentials.

## License

MIT
