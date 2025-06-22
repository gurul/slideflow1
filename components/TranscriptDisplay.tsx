'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Mic, MicOff, Loader2 } from 'lucide-react';

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
  isTranscribing: boolean;
  recordingSlideNumber: number | null;
  onClearTranscripts: () => void;
  className?: string;
}

export default function TranscriptDisplay({
  transcripts,
  currentSlide,
  maxReachedSlide,
  isRecording,
  isTranscribing,
  recordingSlideNumber,
  onClearTranscripts,
  className = ''
}: TranscriptDisplayProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Group transcripts by slide
  const slideGroups = transcripts.reduce((acc, entry) => {
    if (!acc[entry.slideNumber]) {
      acc[entry.slideNumber] = [];
    }
    acc[entry.slideNumber].push(entry);
    return acc;
  }, {} as Record<number, TranscriptEntry[]>);

  // Create array of all slides from 1 to maxReachedSlide
  const allSlides = Array.from({ length: maxReachedSlide }, (_, i) => i + 1);

  // Export transcript as text file
  const exportTranscript = async () => {
    setIsExporting(true);
    try {
      const content = allSlides
        .map((slideNum) => {
          const entries = slideGroups[slideNum] || [];
          const slideText = entries.map(entry => entry.text).join(' ');
          return `Slide ${slideNum}:\n${slideText || '[No transcript]'}\n`;
        })
        .join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation-transcript-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transcript:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export as markdown
  const exportAsMarkdown = async () => {
    setIsExporting(true);
    try {
      const content = `# Presentation Transcript\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n${allSlides
        .map((slideNum) => {
          const entries = slideGroups[slideNum] || [];
          const slideText = entries.map(entry => entry.text).join(' ');
          return `## Slide ${slideNum}\n\n${slideText || '[No transcript]'}\n`;
        })
        .join('\n')}`;

      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation-transcript-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transcript:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={`p-4 shadow-lg bg-white border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          {isRecording ? (
            <Mic className="h-5 w-5 mr-2 text-red-500 animate-pulse" />
          ) : (
            <MicOff className="h-5 w-5 mr-2 text-gray-400" />
          )}
          Slide Transcripts
          {isTranscribing && (
            <Loader2 className="h-4 w-4 ml-2 animate-spin text-blue-500" />
          )}
        </h3>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportTranscript}
            disabled={transcripts.length === 0 || isExporting}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsMarkdown}
            disabled={transcripts.length === 0 || isExporting}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearTranscripts}
            disabled={transcripts.length === 0}
            className="text-xs text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
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

      {transcripts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>
              Total segments: {transcripts.length}
            </span>
            <span>
              Slides with transcripts: {Object.keys(slideGroups).length}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
} 