# slideflow

A simple presentation rehearsal tool for tracking slide timing and reviewing what you say while presenting.

## Overview

slideflow lets you upload a presentation PDF, practice your delivery, and review basic timing and speech data. It records how long you spend on each slide and generates slide-by-slide transcripts so you can reflect and improve.

## Features

- **Per-Slide Timing**: Automatically tracks time spent on each slide to help balance pacing
- **Speech Transcription**: Uses Google Cloud Speech-to-Text to transcribe your voice accurately, even for longer recordings
- **Slide-Aware Transcripts**: Transcripts are segmented by slide number for easy review
- **Export Options**: Download transcripts as `.txt` or `.md` files
- **Automatic Cleanup**: Audio files are automatically deleted after transcription to ensure privacy

## Live Demo

[Try the Live Demo](https://slideflow1.vercel.app/)

<<<<<<< HEAD
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

## Architecture

### System Overview

SlideFlow is built on Next.js 14 with the App Router, using a client-server architecture with asynchronous processing for speech transcription.

### Architecture Layers

**Frontend Layer**
- Next.js 14 App Router with React Server Components and Client Components
- TypeScript for type safety
- Tailwind CSS for styling
- PDF.js for client-side PDF rendering
- React hooks for state management (`useState`, `useRef`, `useEffect`)

**API Layer** (`app/api/`)
- `/api/transcribe` - Initiates async transcription via Google Cloud Storage
- `/api/transcribe/status` - Polls transcription operation status
- `/api/practice-clicks` - Tracks practice session count (Supabase)
- `/api/debug-env` - Environment variable debugging
- `/api/test-credentials` - Google Cloud credentials validation

**External Services**
- Google Cloud Storage - Temporary audio file storage
- Google Cloud Speech-to-Text - Asynchronous long-form transcription
- Supabase - Practice session counter persistence

### Data Flow

**Presentation Practice Flow:**
1. User uploads PDF → Client converts to base64 → Stored in component state
2. User starts practice → MediaRecorder API captures audio → Chunks stored in memory
3. User navigates slides → Timer tracks per-slide duration → State updates
4. On slide change → Audio blob converted to base64 → POST to `/api/transcribe`
5. API uploads audio to GCS → Initiates long-running recognition → Returns operation name
6. Client polls `/api/transcribe/status` → Retrieves transcript when complete → Updates UI

**Key Components:**

- `app/practice/page.tsx` - Main practice interface, manages slide navigation, timing, and transcription coordination
- `lib/useAudioTranscription.ts` - Custom hook handling MediaRecorder lifecycle, async transcription polling, and transcript state
- `components/PDFViewer.tsx` - PDF.js wrapper for client-side PDF rendering with page navigation
- `components/TranscriptDisplay.tsx` - Displays slide-segmented transcripts in modal view

### State Management

- **Local State**: React `useState` for UI state (current slide, timings, transcripts)
- **Refs**: `useRef` for non-reactive values (timer intervals, audio chunks, elapsed time)
- **Custom Hook**: `useAudioTranscription` encapsulates audio recording and transcription logic
- **External State**: Supabase for practice counter (minimal persistence)

### Storage & Processing

- **Audio Storage**: Temporary files in Google Cloud Storage (auto-deleted after transcription)
- **Transcription**: Asynchronous long-running operations via Google Speech-to-Text API
- **Client Storage**: Transcripts stored in React state (session-only, no persistence)
- **PDF Handling**: Client-side rendering via PDF.js, no server storage

### Performance Optimizations

- Non-blocking slide transitions (transcription happens asynchronously)
- Batched state updates for timer (500ms intervals to reduce re-renders)
- Client-side PDF rendering to minimize server load
- Polling-based async operation status checks

## Configuration

The application requires Google Cloud credentials for speech transcription. Set up the following environment variables:

- `GOOGLE_CREDENTIALS_BASE64` - Base64-encoded Google Cloud service account JSON
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name for audio files
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## License

MIT
