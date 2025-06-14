'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Upload, Timer } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';
import ReactMarkdown from 'react-markdown';
import Chatbot from '@/components/Chatbot';

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setError(null);
    setPdfFile(file);
    setSlideTimings([]);
    setCurrentSlide(1);
    setHasUploadedPresentation(true);

    // Read PDF as base64 and store in state, also send to Gemini
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1]; // Remove data:...;base64,
      setPdfBase64(base64);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: "Analyze this presentation PDF for clarity, flow, and errors.",
          pdfBase64: base64,
        }),
      });
      const data = await res.json();
      // You can now display data.response in your UI, or add it to the chatbot history
      console.log(data.response);
    };
    reader.readAsDataURL(file);
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
    
    setIsPlaying(true);
    
    // Reset elapsed time counter for the current slide
    elapsedTimeRef.current = 0;
    
    // Start timer for current slide with a slight delay to avoid double counting
    setTimeout(() => {
      timerRef.current = createTimer();
    }, 0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleNextSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset elapsed time counter
    elapsedTimeRef.current = 0;
    
    // Move to the next slide
    setCurrentSlide(prev => Math.min(totalSlides, prev + 1));
    
    // If the timer is playing, restart it for the new slide after state has updated
    if (isPlaying) {
      setTimeout(() => {
        // Double-check timer is still null to avoid any race conditions
        if (timerRef.current === null) {
          timerRef.current = createTimer();
        }
      }, 0);
    }
  };

  const handlePreviousSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset elapsed time counter
    elapsedTimeRef.current = 0;
    
    // Move to the previous slide
    setCurrentSlide(prev => Math.max(1, prev - 1));
    
    // If the timer is playing, restart it for the new slide after state has updated
    if (isPlaying) {
      setTimeout(() => {
        // Double-check timer is still null to avoid any race conditions
        if (timerRef.current === null) {
          timerRef.current = createTimer();
        }
      }, 0);
    }
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

  const handleResetTimings = () => {
    setSlideTimings(Array(slideTimings.length).fill(0));
  };

  // Calculate dynamic graph dimensions
  const minGraphHeight = 200;
  const maxGraphHeight = 500;
  const minGraphWidth = 300;
  const slideWidth = 60;
  const maxTime = Math.max(...slideTimings.filter(t => t > 0), 60);
  const graphHeight = 224; // px (h-56)
  const pointMargin = 30; // px
  const leftMargin = 60; // px (increased for more space before first slide)
  const rightMargin = 130; // px (increased by 20px for more space after last slide)
  const pointSpacing = slideTimings.length > 1 ? (Math.max(600, leftMargin + rightMargin + (slideTimings.length - 1) * 60) - leftMargin - rightMargin) / (slideTimings.length - 1) : 0;
  const graphWidth = leftMargin + rightMargin + (slideTimings.length - 1) * pointSpacing;
  const graphMargin = 20; // px
  const innerGraphHeight = graphHeight - 2 * graphMargin;

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
          <Card className="p-4 shadow-lg bg-white border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full gap-4">
                <div className="flex-1 aspect-video bg-gray-100 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                  <div className="w-full h-full pdf-container" key={`pdf-${currentSlide}`}>
                    <PDFViewer 
                      file={pdfFile} 
                      currentPage={currentSlide} 
                      onTotalPagesFound={handleTotalPages} 
                    />
                  </div>
                </div>
                <div className="w-72 bg-white border rounded-lg p-4 shadow-md flex flex-col h-[580px]">
                  <h3 className="text-lg font-semibold mb-2 text-gray-700 flex items-center border-b pb-2">
                    <Timer className="h-5 w-5 mr-2" strokeWidth={2.5} />
                    Slide Timings
                  </h3>
                  <div className="space-y-2 overflow-y-auto pr-1 flex-grow">
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
                  {!showStats && (
                    <div className="flex flex-col gap-4 w-full mt-8">
                      <Button
                        onClick={handleResetTimings}
                        disabled={slideTimings.length === 0 || slideTimings.every(t => t === 0)}
                        className="w-full bg-black text-white border border-black hover:bg-gray-900 hover:text-white transition-all text-lg py-4"
                        size="lg"
                      >
                        Reset Timings
                      </Button>
                      <Button
                        className="w-full bg-black text-white border border-black hover:bg-gray-900 hover:text-white transition-all text-lg py-4"
                        size="lg"
                        onClick={() => setShowStats(true)}
                      >
                        Show Statistics
                      </Button>
                    </div>
                  )}
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
                            <div className="bg-white p-3 rounded-lg border border-gray-100 h-56 relative mt-2">
                              {/* Y-axis grid lines and labels */}
                              <div className="absolute left-0 top-0 h-full w-full">
                                {[0, 1, 2, 3, 4].map((i) => {
                                  const y = graphMargin + (i * (innerGraphHeight / 4));
                                  return (
                                    <div key={i} className="absolute w-full border-t border-gray-100" style={{ top: `${(y / graphHeight) * 100}%`, left: 0 }}></div>
                                  );
                                })}
                              </div>
                              <div className="absolute left-8 top-0 right-0 bottom-0 flex flex-col">
                                <div className="flex-1 relative">
                                  <svg className="w-full h-full" width={graphWidth} height={graphHeight} viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none">
                                    {/* Line */}
                                    {slideTimings.filter(t => t > 0).length > 0 && (
                                      <polyline
                                        points={slideTimings.map((time, index) => {
                                          const x = leftMargin + index * pointSpacing;
                                          const y = graphMargin + (innerGraphHeight - ((time || 0) / maxTime * innerGraphHeight));
                                          return `${x},${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#4B5563"
                                        strokeWidth="3"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                      />
                                    )}
                                    {/* Data Points */}
                                    {slideTimings.map((time, index) => {
                                      const x = leftMargin + index * pointSpacing;
                                      const y = graphMargin + (innerGraphHeight - ((time || 0) / maxTime * innerGraphHeight));
                                      const isCurrentSlide = currentSlide === index + 1;
                                      const tooltipWidth = 80;
                                      const tooltipHeight = 32;
                                      const tooltipArrow = 8;
                                      // Clamp tooltip x so it doesn't overflow left/right
                                      let tooltipX = x - tooltipWidth / 2;
                                      if (tooltipX < 0) tooltipX = 0;
                                      if (tooltipX + tooltipWidth > graphWidth) tooltipX = graphWidth - tooltipWidth;
                                      // Calculate the offset for text/arrow so they're always centered on the point
                                      const textOffset = x - tooltipX;
                                      // If tooltip would go above, render below
                                      const isNearTop = y - tooltipHeight - tooltipArrow < 0;
                                      // If tooltip would go below, render above
                                      const isNearBottom = y + tooltipHeight + tooltipArrow > graphHeight;
                                      return (
                                        <g key={index} className="group">
                                          <circle
                                            cx={x}
                                            cy={y}
                                            r={isCurrentSlide ? 8 : 6}
                                            fill={isCurrentSlide ? "#374151" : "#6B7280"}
                                            stroke="white"
                                            strokeWidth="2"
                                            className="transition-all duration-150 group-hover:scale-150"
                                            style={{ transformOrigin: `${x}px ${y}px` }}
                                          />
                                          <g className="opacity-0 group-hover:opacity-100">
                                            {isNearTop ? (
                                              // Arrow points up, tooltip below
                                              <>
                                                <rect
                                                  x={tooltipX}
                                                  y={y + tooltipArrow}
                                                  width={tooltipWidth}
                                                  height={tooltipHeight}
                                                  rx="8"
                                                  fill="#374151"
                                                />
                                                <text
                                                  x={tooltipX + textOffset}
                                                  y={y + tooltipArrow + tooltipHeight / 2 + 6}
                                                  textAnchor="middle"
                                                  fill="white"
                                                  fontSize="20"
                                                  fontFamily="monospace"
                                                >
                                                  {formatTime(time || 0)}
                                                </text>
                                                <polygon
                                                  points={`${x-tooltipArrow},${y+tooltipArrow} ${x},${y} ${x+tooltipArrow},${y+tooltipArrow}`}
                                                  fill="#374151"
                                                />
                                              </>
                                            ) : (
                                              // Arrow points down, tooltip above
                                              <>
                                                <rect
                                                  x={tooltipX}
                                                  y={y - tooltipArrow - tooltipHeight}
                                                  width={tooltipWidth}
                                                  height={tooltipHeight}
                                                  rx="8"
                                                  fill="#374151"
                                                />
                                                <text
                                                  x={tooltipX + textOffset}
                                                  y={y - tooltipArrow - tooltipHeight / 2 + 6}
                                                  textAnchor="middle"
                                                  fill="white"
                                                  fontSize="20"
                                                  fontFamily="monospace"
                                                >
                                                  {formatTime(time || 0)}
                                                </text>
                                                <polygon
                                                  points={`${x-tooltipArrow},${y-tooltipArrow} ${x},${y} ${x+tooltipArrow},${y-tooltipArrow}`}
                                                  fill="#374151"
                                                />
                                              </>
                                            )}
                                          </g>
                                        </g>
                                      );
                                    })}
                                  </svg>
                                </div>
                                <div className="h-8 relative border-t border-gray-200 flex">
                                  {slideTimings.length > 0 && slideTimings.map((_, index) => {
                                    const x = leftMargin + index * pointSpacing;
                                    const totalWidth = graphWidth;
                                    const percentPos = x / totalWidth * 100;
                                    return (
                                      <div 
                                        key={index} 
                                        className="absolute flex flex-col items-center"
                                        style={{ 
                                          left: `${percentPos}%`, 
                                          transform: 'translateX(-50%)'
                                        }}
                                      >
                                        <div className="h-2 w-px bg-gray-300 mb-1"></div>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                                          currentSlide === index + 1 ? 'bg-gray-600' : 'bg-gray-400'
                                        }`}>
                                          {index + 1}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="text-center text-xs text-gray-500 mt-2">Slide Number</div>
                          </div>
                          {/* --- Statistics Section Content End --- */}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white border rounded-lg p-3 shadow-sm w-full max-w-lg justify-center">
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

              <div className="text-sm bg-gray-50 p-2 rounded-lg border shadow-sm w-full max-w-lg text-center">
                <span className="font-semibold text-gray-700">Current Slide:</span> {formatTime(slideTimings[currentSlide - 1] || 0)} | 
                <span className="font-semibold text-gray-700 ml-2">Position:</span> Slide {currentSlide}/{totalSlides}
              </div>
            </div>
          </Card>
        )}

        {/* Chatbot will only show up after presentation is uploaded */}
        <Chatbot 
          isVisible={false} 
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          slideTimings={slideTimings}
          pdfName={pdfFile?.name}
          pdfBase64={pdfBase64}
        />
      </div>
    </div>
  );
} 