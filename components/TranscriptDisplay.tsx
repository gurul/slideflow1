'use client';

import { Card } from '@/components/ui/card';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface TranscriptEntry {
  slideNumber: number;
  text: string;
  timestamp: Date;
}

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[];
  currentSlide: number;
  maxReachedSlide: number;
  isRecording: boolean;
  recordingSlideNumber: number | null;
  className?: string;
}

export default function TranscriptDisplay({
  transcripts,
  currentSlide,
  maxReachedSlide,
  isRecording,
  recordingSlideNumber,
  className = ''
}: TranscriptDisplayProps) {

  const slideGroups = transcripts.reduce((acc, entry) => {
    if (!acc[entry.slideNumber]) {
      acc[entry.slideNumber] = [];
    }
    acc[entry.slideNumber].push(entry);
    return acc;
  }, {} as Record<number, TranscriptEntry[]>);

  const allSlides = Array.from({ length: maxReachedSlide }, (_, i) => i + 1);

  return (
    <div className={`space-y-4 ${className}`}>
      {maxReachedSlide === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Mic className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Upload a presentation and start practicing to see slide transcripts.</p>
        </div>
      ) : (
        allSlides.map((slideNumber) => {
          const entries = slideGroups[slideNumber];
          const slideNum = slideNumber.toString();
          const isCurrentSlide = slideNumber === currentSlide;
          const isPreviousSlide = slideNumber < currentSlide;
          const isFutureSlide = slideNumber > currentSlide;
          const slideText = entries?.map(entry => entry.text).join(' ');
          
          const isCurrentlyRecordingThisSlide = isRecording && recordingSlideNumber === slideNumber;
          const hasTranscript = entries && entries.length > 0;

          return (
            <div
              key={slideNum}
              className={`p-3 border rounded-lg transition-all duration-200 ${
                isCurrentSlide
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : isPreviousSlide
                  ? 'bg-gray-100 border-gray-300 opacity-75'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium text-sm ${
                  isCurrentSlide 
                    ? 'text-blue-700' 
                    : isPreviousSlide 
                    ? 'text-gray-500'
                    : 'text-gray-600'
                }`}>
                  Slide {slideNum}
                  {isCurrentSlide && isRecording && (
                    <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                  {isPreviousSlide && hasTranscript && (
                    <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </h4>
                {entries && (
                  <span className="text-xs text-gray-400">
                    {entries.length} segment{entries.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className={`text-sm leading-relaxed ${
                isPreviousSlide ? 'text-gray-600' : 'text-gray-700'
              }`}>
                {isCurrentlyRecordingThisSlide && !slideText ? (
                   <div className="text-sm text-gray-500 italic flex items-center">
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Recording... transcript will appear here when you move to the next slide.
                   </div>
                ) : slideText ? (
                  slideText
                ) : isPreviousSlide ? (
                  <span className="text-gray-400 italic">
                    [No transcript recorded]
                  </span>
                ) : isFutureSlide ? (
                  <span className="text-gray-400 italic">
                    [Not yet reached]
                  </span>
                ) : (
                  <span className="text-gray-400 italic">
                    [Start recording to see transcript here]
                  </span>
                )}
              </div>
              
              {entries && entries.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Last updated: {entries[entries.length - 1].timestamp.toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
} 