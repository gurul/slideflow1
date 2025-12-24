# SlideFlow 🎤📊  
*AI-powered presentation rehearsal with live transcription, timing insights, and contextual feedback.*

## 🚀 Overview

**SlideFlow** is a smart rehearsal tool for presenters. Whether you’re pitching an idea, giving a lecture, or practicing a talk, SlideFlow helps you improve clarity, pacing, and confidence. Upload your slides, present as usual, and get instant AI-powered feedback per slide.

## ✨ Key Features

- ⏱ **Per-Slide Timing**  
  Automatically tracks how long you spend on each slide to help balance pacing.

- 🗣 **Live Speech Transcription**  
  Uses Google Cloud Speech-to-Text (asynchronous) to transcribe your voice accurately—even for longer recordings.

- 📌 **Slide-Aware Transcript Tagging**  
  Transcripts are segmented by slide (e.g., `Slide 1:`, `Slide 2:`) to preserve contextual clarity.

- 📤 **Export Options**  
  Download transcripts as `.txt` or `.md` files for future reference or review.

- 🧹 **Automatic File Cleanup**  
  Audio files are uploaded to Google Cloud Storage, transcribed, and then automatically deleted to save space and ensure privacy.

## 🤖 AI Capabilities

- **Accurate Long-Form Transcription**: Handles multi-minute recordings using GCP's asynchronous Speech-to-Text API.

## 🧪 Live Demo

🌐 [Try the Live Demo](https://slideflow1.vercel.app/)  
> _Upload a PDF to begin a session._

## 🛠 Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS  
- **Backend**: Node.js (API Routes), Google Cloud Storage  
- **AI Services**:  
  - Google Cloud Speech-to-Text  