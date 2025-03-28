'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, Upload } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';

export default function PracticePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideTimings, setSlideTimings] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalSlides, setTotalSlides] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size should be less than 10MB');
      return;
    }

    setError(null);
    setPdfFile(file);
    setSlideTimings([]);
    setCurrentSlide(1);
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

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-indigo-800 border-b pb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 inline-block mr-2 mb-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
        </svg>
        Practice Your Presentation
      </h1>
      
      <Card className="p-6 mb-8 shadow-md bg-white border-indigo-100">
        <div className="flex items-center gap-4">
          <Label htmlFor="pdf-upload" className="cursor-pointer">
            <Button variant="outline" size="lg" asChild className="border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
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
            <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-md flex items-center">
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
        <Card className="p-6 shadow-lg bg-white border-indigo-100">
          <div className="flex flex-col items-center gap-6">
            <div className="flex w-full gap-6">
              <div className="flex-1 aspect-video bg-gray-100 rounded-lg flex items-center justify-center shadow-md overflow-hidden">
                {/* Use key to control when PDFViewer should re-render */}
                <div className="w-full h-full pdf-container" key={`pdf-${currentSlide}`}>
                  <PDFViewer 
                    file={pdfFile} 
                    currentPage={currentSlide} 
                    onTotalPagesFound={handleTotalPages} 
                  />
                </div>
              </div>
              <div className="w-72 bg-white border rounded-lg p-5 shadow-md">
                <h3 className="text-lg font-semibold mb-3 text-indigo-700 flex items-center border-b pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Slide Timings
                </h3>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {Array.from({ length: totalSlides }, (_, i) => (
                    <div 
                      key={i}
                      className={`p-3 border rounded-lg flex justify-between items-center transition-all duration-200 ${
                        currentSlide === i + 1 
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`font-medium ${currentSlide === i + 1 ? 'text-indigo-700' : ''}`}>
                        Slide {i + 1}
                      </span>
                      <span className={`font-mono text-sm px-3 py-1 rounded ${
                        slideTimings[i] 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {formatTime(slideTimings[i] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-5 bg-white border rounded-lg p-4 shadow-sm w-full max-w-lg justify-center">
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
                className={`w-32 transition-all ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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

            <div className="text-sm bg-gray-50 p-3 rounded-lg border shadow-sm w-full max-w-lg text-center">
              <span className="font-semibold text-indigo-700">Current slide:</span> {formatTime(slideTimings[currentSlide - 1] || 0)} | 
              <span className="font-semibold text-indigo-700 ml-2">Position:</span> Slide {currentSlide}/{totalSlides}
            </div>
            
            {/* Stats Section */}
            <div className="w-full max-w-lg bg-white rounded-lg border shadow-md p-4 mt-2">
              <h3 className="text-lg font-semibold text-indigo-700 mb-3 flex items-center border-b pb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 100 2h10a1 1 0 100-2H3z" clipRule="evenodd" />
                </svg>
                Presentation Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-500 mb-1">Total Time</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {formatTime(slideTimings.reduce((total, time) => total + (time || 0), 0))}
                  </p>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-500 mb-1">Average Time/Slide</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {formatTime(Math.round(
                      slideTimings.reduce((total, time) => total + (time || 0), 0) / 
                      (slideTimings.filter(t => t > 0).length || 1)
                    ))}
                  </p>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-500 mb-1">Longest Slide</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {(() => {
                      const maxTime = Math.max(...slideTimings.filter(t => t > 0));
                      const maxIndex = slideTimings.findIndex(t => t === maxTime);
                      return maxTime > 0 ? `Slide ${maxIndex + 1} (${formatTime(maxTime)})` : 'N/A';
                    })()}
                  </p>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-sm text-indigo-500 mb-1">Shortest Slide</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {(() => {
                      const timedSlides = slideTimings.filter(t => t > 0);
                      const minTime = timedSlides.length > 0 ? Math.min(...timedSlides) : 0;
                      const minIndex = slideTimings.findIndex(t => t === minTime);
                      return minTime > 0 ? `Slide ${minIndex + 1} (${formatTime(minTime)})` : 'N/A';
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Time Distribution Graph */}
              <h4 className="font-medium text-indigo-700 mb-2">Time Distribution</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Time spent on each slide</span>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-600 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-500">Current Slide</span>
                  </div>
                </div>
                
                {/* Line Graph */}
                <div className="bg-white p-4 rounded-lg border border-gray-100 h-64 relative mt-2">
                  {/* Y-axis grid lines and labels */}
                  <div className="absolute left-0 top-0 h-full w-full">
                    {[0, 1, 2, 3, 4].map((i) => {
                      // Calculate max time, default to 60 seconds if no data
                      const maxTimeValue = Math.max(...slideTimings.filter(t => t > 0), 60);
                      // Calculate the time value for this grid line
                      const timeValue = Math.round((4-i) * (maxTimeValue / 4));
                      
                      return (
                        <div key={i} className="absolute w-full border-t border-gray-100" style={{ top: `${i * 25}%`, left: 0 }}>
                          <span className="absolute text-xs text-gray-400" style={{ left: '0px', top: '-8px' }}>
                            {formatTime(timeValue)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Line Chart */}
                  <div className="absolute left-8 top-0 right-0 bottom-0 flex flex-col">
                    <div className="flex-1 relative">
                      <svg className="w-full h-full" viewBox={`0 0 ${Math.max(slideTimings.length * 60, 300)} 100`} preserveAspectRatio="xMidYMid meet">
                        {/* Line */}
                        {slideTimings.filter(t => t > 0).length > 0 && (
                          <polyline
                            points={slideTimings.map((time, index) => {
                              const maxTime = Math.max(...slideTimings.filter(t => t > 0), 60);
                              const x = (index * 60) + 30; // Center points in each segment
                              const y = 100 - ((time || 0) / maxTime * 100);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="3"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        )}
                        
                        {/* Data Points */}
                        {slideTimings.map((time, index) => {
                          const maxTime = Math.max(...slideTimings.filter(t => t > 0), 60);
                          const x = (index * 60) + 30; // Center points in each segment
                          const y = 100 - ((time || 0) / maxTime * 100);
                          const isCurrentSlide = currentSlide === index + 1;
                          
                          return (
                            <g key={index} className="group">
                              {/* Data Point */}
                              <circle
                                cx={x}
                                cy={y}
                                r={isCurrentSlide ? 6 : 4}
                                fill={isCurrentSlide ? "#4f46e5" : "#818cf8"}
                                stroke="white"
                                strokeWidth="2"
                              />
                              
                              {/* Tooltip */}
                              <g className="opacity-0 group-hover:opacity-100">
                                <rect
                                  x={x - 25}
                                  y={Math.max(5, y - 35)}
                                  width="50"
                                  height="20"
                                  rx="4"
                                  fill="#4f46e5"
                                />
                                <text
                                  x={x}
                                  y={Math.max(20, y - 21)}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="10"
                                >
                                  {formatTime(time || 0)}
                                </text>
                                <polygon
                                  points={`${x-5},${Math.max(25, y - 15)} ${x},${Math.max(30, y - 10)} ${x+5},${Math.max(25, y - 15)}`}
                                  fill="#4f46e5"
                                />
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="h-8 relative border-t border-gray-200 flex">
                      {slideTimings.length > 0 && slideTimings.map((_, index) => {
                        // Calculate total width of SVG viewport
                        const totalWidth = Math.max(slideTimings.length * 60, 300);
                        // Calculate percentage position for this slide marker
                        const percentPos = (index * 60 + 30) / totalWidth * 100;
                        
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
                              currentSlide === index + 1 ? 'bg-indigo-600' : 'bg-gray-400'
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
              
              {/* Tips based on statistics */}
              {slideTimings.filter(t => t > 0).length > 2 && (
                <div className="mt-4 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-700 mb-1">Practice Tips</h4>
                  <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    {(() => {
                      const tips = [];
                      const timedSlides = slideTimings.filter(t => t > 0);
                      const avgTime = timedSlides.reduce((total, t) => total + t, 0) / timedSlides.length;
                      
                      // Check for slides that took much longer than average
                      const maxTime = Math.max(...timedSlides);
                      const maxIndex = slideTimings.findIndex(t => t === maxTime);
                      if (maxTime > avgTime * 1.5 && maxTime > 30) {
                        tips.push(
                          <li key="long">Slide {maxIndex + 1} took significantly longer than others. Consider simplifying its content.</li>
                        );
                      }
                      
                      // Check for slides that were very quick
                      const minTime = Math.min(...timedSlides);
                      const minIndex = slideTimings.findIndex(t => t === minTime);
                      if (minTime < avgTime * 0.5 && maxTime > 20) {
                        tips.push(
                          <li key="short">Slide {minIndex + 1} was very brief. Consider adding more detail or combining with another slide.</li>
                        );
                      }
                      
                      // Check for consistency
                      const stdDev = Math.sqrt(
                        timedSlides.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / timedSlides.length
                      );
                      if (stdDev > avgTime * 0.7) {
                        tips.push(
                          <li key="consistency">Your timing varies significantly between slides. Try to maintain more consistent pacing.</li>
                        );
                      }
                      
                      // If no specific tips, give general advice
                      if (tips.length === 0) {
                        tips.push(
                          <li key="general">Your timing distribution looks good! Keep practicing to improve consistency.</li>
                        );
                      }
                      
                      return tips;
                    })()}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 