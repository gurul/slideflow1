'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Upload, Timer, Trash2, Info, FileText, Download } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import { useAudioTranscription } from '@/lib/useAudioTranscription';

export default function PracticePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideTimings, setSlideTimings] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalSlides, setTotalSlides] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [hasUploadedPresentation, setHasUploadedPresentation] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [maxReachedSlide, setMaxReachedSlide] = useState(0);
  const [showTranscriptsModal, setShowTranscriptsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Audio transcription hook
  const {
    isRecording,
    isTranscribing,
    transcripts,
    recordingSlideNumber,
    pendingOperations,
    startRecording,
    stopRecording,
    clearTranscripts,
    getFormattedTranscript
  } = useAudioTranscription({
    onError: (error) => setError(error)
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size - must be under 4MB
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 4) {
      setError(`File is too large (${fileSizeMB.toFixed(2)} MB). Please upload a file smaller than 4MB.`);
      return;
    }

    try {
      setError(null);
      setPdfFile(file);
      setSlideTimings([]);
      setCurrentSlide(1);
      setMaxReachedSlide(1);
      setHasUploadedPresentation(true);
      clearTranscripts(); // Clear any previous transcripts

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to convert PDF to base64'));
        reader.readAsDataURL(file);
      });

      setPdfBase64(base64);
    } catch (error) {
      console.error('Error processing PDF:', error);
      setError(error instanceof Error ? error.message : 'Failed to process PDF file');
      setPdfFile(null);
      setPdfBase64(null);
      setHasUploadedPresentation(false);
    }
  };
  
  const handleTotalPages = (total: number) => {
    setTotalSlides(total);
  };

  // Use useRef to track elapsed time without causing re-renders
  const elapsedTimeRef = useRef<number>(0);
  const currentSlideRef = useRef<number>(1);
  
  // Update the ref whenever currentSlide changes
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);
  
  const handleStartPractice = () => {
    if (!pdfFile) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset context and start from Slide 1
    setCurrentSlide(1);
    setMaxReachedSlide(1);
    clearTranscripts();
    setSlideTimings([]);
    elapsedTimeRef.current = 0;
    
    setIsPlaying(true);
    
    // Start recording for Slide 1
    startRecording(1);
    
    // Start timer for Slide 1
    setTimeout(() => {
      timerRef.current = createTimer();
    }, 0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Stop recording when paused
    stopRecording();
  };

  const handleNextSlide = () => {
    const nextSlide = Math.min(totalSlides, currentSlide + 1);
    
    // Update slide immediately for responsive UI
    setMaxReachedSlide(prev => Math.max(nextSlide, prev));
    setCurrentSlide(nextSlide);

    // Stop recording in the background (don't await - transcription happens async)
    if (isPlaying) {
      stopRecording().catch(err => {
        console.error('Error stopping recording:', err);
      });
      // Start recording for the new slide immediately
      startRecording(nextSlide);
    }
  };

  const handlePreviousSlide = async () => {
    if (isPlaying) {
      await stopRecording(); // Finalize transcript for the current slide
      setIsPlaying(false); // Pause the practice session
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    const previousSlide = Math.max(1, currentSlide - 1);
    setCurrentSlide(previousSlide);
  };
  
  // Helper function to create a timer with better performance
  const createTimer = () => {
    // Store the last update time to calculate accurate intervals
    let lastUpdateTime = Date.now();
    let lastRenderTime = Date.now();
    
    return setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastUpdateTime) / 1000);
      
      if (deltaSeconds > 0) {
        lastUpdateTime = now;
        
        // Update the internal counter without re-rendering
        elapsedTimeRef.current += deltaSeconds;
        
        // Use currentSlideRef to always get the current slide
        const slideIndex = currentSlideRef.current - 1;
        
        // Update the state less frequently (every 500ms) to reduce flickering
        // This helps prevent PDF viewer re-renders while still keeping timings up-to-date
        const timeSinceLastRender = now - lastRenderTime;
        if (timeSinceLastRender >= 500) {
          lastRenderTime = now;
          
          // Batch state updates to minimize rendering impact
          setSlideTimings(prev => {
            const newTimings = [...prev];
            newTimings[slideIndex] = (newTimings[slideIndex] || 0) + deltaSeconds;
            return newTimings;
          });
        }
      }
    }, 1000);
  };
  
  // Cleanup timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClearAllData = () => {
    setSlideTimings(Array(totalSlides).fill(0));
    clearTranscripts();
    setMaxReachedSlide(1);
    setCurrentSlide(1);
    if (isPlaying) {
      handlePause();
    }
  };

  // Guard against rendering graph if there's no data
  const hasTimingData = slideTimings.some(t => typeof t === 'number' && t > 0);

  // Fixed graph dimensions for a non-scrolling container, per user instructions
  const graphWidth = 600;
  const graphHeight = 250;
  const graphMargin = 20; // Top and bottom margin
  const innerGraphHeight = graphHeight - 2 * graphMargin;
  
  // Proportional point spacing
  const pointSpacing = slideTimings.length > 0 ? graphWidth / (slideTimings.length + 1) : 0;
  
  // Y-axis max time
  const maxTime = hasTimingData ? Math.max(...slideTimings.filter(t => typeof t === 'number' && t > 0), 1) : 60;

  const handleClearTranscripts = () => {
    clearTranscripts();
    setMaxReachedSlide(0);
    setCurrentSlide(1);
  };

  const exportTranscripts = async (format: 'txt' | 'md') => {
    if (transcripts.length === 0) return;
    setIsExporting(true);

    const slideGroups = transcripts.reduce((acc, entry) => {
      if (!acc[entry.slideNumber]) {
        acc[entry.slideNumber] = [];
      }
      acc[entry.slideNumber].push(entry);
      return acc;
    }, {} as Record<number, { slideNumber: number; text: string; timestamp: Date }[]>);

    const allSlides = Array.from({ length: totalSlides }, (_, i) => i + 1);

    let content = '';
    let fileExtension = '';

    if (format === 'md') {
      content = `# Presentation Transcript\n\nGenerated on: ${new Date().toLocaleDateString()}\n\n${allSlides
        .map((slideNum) => {
          const entries = slideGroups[slideNum] || [];
          const slideText = entries.map(entry => entry.text).join(' ');
          return `## Slide ${slideNum}\n\n${slideText || '[No transcript]'}\n`;
        })
        .join('\n')}`;
      fileExtension = 'md';
    } else { // Default to TXT
      content = allSlides
        .map((slideNum) => {
          const entries = slideGroups[slideNum] || [];
          const slideText = entries.map(entry => entry.text).join(' ');
          return `Slide ${slideNum}:\n${slideText || '[No transcript]'}\n`;
        })
        .join('\n');
      fileExtension = 'txt';
    }

    try {
      const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presentation-transcript-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transcript:', error);
      setError('Failed to export transcript.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Practice Your Presentation</h1>
        
        <Card className="p-4 mb-4 shadow-md bg-white border-gray-200">
          <div className="flex items-center gap-4">
            <Label htmlFor="pdf-upload" className="cursor-pointer">
              <Button variant="outline" size="lg" asChild className="border-black bg-black text-white hover:bg-gray-900 hover:text-white transition-all">
                <div>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Presentation PDF
                </div>
              </Button>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </Label>
            {pdfFile && (
              <span className="text-sm bg-gray-50 text-gray-700 px-3 py-2 rounded-md flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                {pdfFile.name}
              </span>
            )}
          </div>
          
          {/* File size requirement notice */}
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">File Size Requirement</p>
                <p className="text-sm text-green-700 mt-1">
                  Your PDF must be <strong>under 4MB</strong>. If your file is larger, please compress it first or reduce the number of pages.
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </Card>

        {pdfFile && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left side: PDF Viewer and controls */}
            <div className="w-full md:w-2/3">
              <Card className="p-4 shadow-lg bg-white border-gray-200 sticky top-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center shadow-md overflow-hidden mb-4">
                    <div className="w-full h-full pdf-container" key={`pdf-${currentSlide}`}>
                      <PDFViewer 
                        file={pdfFile} 
                        currentPage={currentSlide} 
                        onTotalPagesFound={handleTotalPages} 
                      />
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white border rounded-lg p-3 shadow-sm w-full max-w-lg justify-center mx-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePreviousSlide}
                    disabled={currentSlide === 1}
                    className="border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Previous
                  </Button>
                  
                  <Button
                    onClick={isPlaying ? handlePause : handleStartPractice}
                    size="lg"
                    className={`w-32 transition-all ${isPlaying ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Play
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleNextSlide}
                    disabled={currentSlide >= totalSlides}
                    className="border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-all"
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>

                <div className="text-sm bg-gray-50 p-2 mt-4 rounded-lg border shadow-sm w-full max-w-lg text-center mx-auto">
                  <span className="font-semibold text-gray-700">Current Slide:</span> {formatTime(slideTimings[currentSlide - 1] || 0)} | 
                  <span className="font-semibold text-gray-700 ml-2">Position:</span> Slide {currentSlide}/{totalSlides}
                </div>
              </Card>
            </div>

            {/* Right side: Timings and Transcripts */}
            <div className="w-full md:w-1/3 flex flex-col gap-8">
              <Card className="p-4 shadow-lg bg-white border-gray-200">
                <div className="flex items-center justify-between mb-2 border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                    <Timer className="h-5 w-5 mr-2" strokeWidth={2.5} />
                    Slide Timings
                  </h3>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllData}
                      disabled={!hasTimingData && transcripts.length === 0}
                      className="flex items-center text-red-500 hover:text-red-700 disabled:text-gray-400"
                      aria-label="Clear all data"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStats(true)}
                      disabled={totalSlides === 0}
                      aria-label="Show statistics"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 overflow-y-auto pr-1 flex-grow max-h-[480px]">
                  {Array.from({ length: totalSlides }, (_, i) => (
                    <div 
                      key={i}
                      className={`p-2 border rounded-lg flex justify-between items-center transition-all duration-200 ${
                        currentSlide === i + 1 
                          ? 'bg-gray-50 border-gray-300 shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setCurrentSlide(i + 1)}
                    >
                      <span className={`font-medium ${currentSlide === i + 1 ? 'text-gray-700' : ''}`}>
                        Slide {i + 1}
                      </span>
                      <span className={`font-mono text-sm px-2 py-1 rounded ${
                        slideTimings[i] 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-gray-50 text-gray-400'
                      }`}>
                        {formatTime(slideTimings[i] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* --- Transcription Section --- */}
              <Card className="p-3 shadow-lg bg-white border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-700">Transcription</h3>
                    {isRecording ? (
                      <div className="flex items-center text-sm font-medium text-red-600">
                        <span className="relative flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Recording
                      </div>
                    ) : (
                      <div className="flex items-center text-sm font-medium text-gray-500">
                        <span className="flex h-2 w-2 mr-2 bg-gray-400 rounded-full"></span>
                        Not Recording
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowTranscriptsModal(true)} disabled={maxReachedSlide === 0}>
                    <FileText className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        )}

        {/* --- Transcripts Modal --- */}
        {showTranscriptsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <Card className="bg-white rounded-lg border shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-gray-600" />
                  Slide Transcripts
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-800 transition-colors"
                  onClick={() => setShowTranscriptsModal(false)}
                  aria-label="Close"
                >
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 flex-grow overflow-y-auto">
                <TranscriptDisplay
                  transcripts={transcripts}
                  currentSlide={currentSlide}
                  maxReachedSlide={maxReachedSlide}
                  isRecording={isRecording}
                  recordingSlideNumber={recordingSlideNumber}
                  pendingOperations={pendingOperations}
                />
              </div>

              <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => exportTranscripts('txt')}
                    disabled={isExporting || transcripts.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .TXT
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportTranscripts('md')}
                    disabled={isExporting || transcripts.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .MD
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Statistics Modal */}
        {showStats && (
          <>
            {/* Modal Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              {/* Modal Content */}
              <div className="bg-white rounded-lg border shadow-lg p-6 w-full max-w-xl relative">
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl font-bold"
                  onClick={() => setShowStats(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center border-b pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
                  </svg>
                  Presentation Statistics
                </h3>
                {/* --- Statistics Section Content Start --- */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm text-gray-500 mb-1">Total Time</p>
                    <p className="text-xl font-bold text-gray-700">
                      {formatTime(slideTimings.reduce((total, time) => total + (time || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-sm text-gray-500 mb-1">Average Time/Slide</p>
                    <p className="text-xl font-bold text-gray-700">
                      {formatTime(Math.round(
                        slideTimings.reduce((total, time) => total + (time || 0), 0) / 
                        (slideTimings.filter(t => t > 0).length || 1)
                      ))}
                    </p>
                  </div>
                </div>
                <h4 className="font-medium text-gray-700 mb-2">Time Distribution</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Time spent on each slide</span>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-600 rounded-full mr-1"></div>
                      <span className="text-xs text-gray-500">Current Slide</span>
                    </div>
                  </div>
                  <div
                    className="relative mt-2 overflow-hidden bg-white rounded-lg border"
                    style={{ width: '100%', height: '250px' }}
                  >
                    {!hasTimingData ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-500">No slide timing data to display.</p>
                      </div>
                    ) : (
                      <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                        preserveAspectRatio="none"
                        className="font-sans"
                      >
                        {/* Grid lines without text */}
                        {[0, 1, 2, 3, 4].map(i => {
                          const y = graphMargin + (i * (innerGraphHeight / 4));
                          return <line key={i} x1="0" x2={graphWidth} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1"/>;
                        })}

                        {/* Line */}
                        <polyline
                          points={slideTimings.map((time, index) => {
                            const safeTime = Math.min(Math.max(time || 0, 0), maxTime);
                            const x = pointSpacing * (index + 1);
                            const y = graphMargin + (innerGraphHeight - (safeTime / maxTime) * innerGraphHeight);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#4B5563"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />

                        {/* Points */}
                        {slideTimings.map((time, index) => {
                            if (!Number.isFinite(time)) return null;
                            const safeTime = Math.min(Math.max(time || 0, 0), maxTime);
                            const x = pointSpacing * (index + 1);
                            const y = graphMargin + (innerGraphHeight - (safeTime / maxTime) * innerGraphHeight);
                            const isCurrentSlide = currentSlide === index + 1;

                            return (
                                <g key={index} className="group">
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isCurrentSlide ? 7 : 5}
                                        fill={isCurrentSlide ? "#374151" : "#6B7280"}
                                        stroke="white"
                                        strokeWidth="2"
                                        className="transition-all duration-150"
                                    />
                                    {/* Tooltip on Hover */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        {y < 40 ? (
                                            // Render tooltip BELOW the point if it's too high
                                            <>
                                                <rect x={x - 25} y={y + 10} width="50" height="20" rx="4" fill="#374151" />
                                                <text x={x} y={y + 24} textAnchor="middle" fill="white" fontSize="12">{formatTime(time || 0)}</text>
                                            </>
                                        ) : (
                                            // Render tooltip ABOVE the point by default
                                            <>
                                                <rect x={x - 25} y={y - 30} width="50" height="20" rx="4" fill="#374151" />
                                                <text x={x} y={y - 16} textAnchor="middle" fill="white" fontSize="12">{formatTime(time || 0)}</text>
                                            </>
                                        )}
                                    </g>
                                    {/* Slide Number Label */}
                                    <text x={x} y={graphHeight - 5} textAnchor="middle" fontSize="12" fill="#6B7280">{index + 1}</text>
                                </g>
                            );
                        })}
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}