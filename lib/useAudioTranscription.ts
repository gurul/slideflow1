import { useState, useRef, useCallback, useEffect } from 'react';

interface TranscriptEntry {
  slideNumber: number;
  text: string;
  timestamp: Date;
}

interface UseAudioTranscriptionProps {
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onError?: (error: string) => void;
}

// Helper function to get audio duration from a blob
const getAudioDuration = (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Cannot get audio duration on the server.'));
    }
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = document.createElement('audio');
      audioElement.src = audioUrl;

      audioElement.onloadedmetadata = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(audioElement.duration);
      };

      audioElement.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        console.error('Error loading audio metadata:', e);
        reject(new Error('Failed to load audio metadata to determine duration.'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

export function useAudioTranscription({ onTranscriptUpdate, onError }: UseAudioTranscriptionProps = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSlideNumber, setRecordingSlideNumber] = useState<number | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Map<string, number>>(new Map());
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const onStopPromiseResolverRef = useRef<((value: void | PromiseLike<void>) => void) | null>(null);
  const pollingIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Poll for async operation completion
  const pollOperationStatus = useCallback(async (operationName: string, slideNumber: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/transcribe/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName,
            slideNumber
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'COMPLETED') {
          // Clear the polling interval
          clearInterval(pollInterval);
          pollingIntervalsRef.current.delete(operationName);
          
          // Remove from pending operations
          setPendingOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(operationName);
            return newMap;
          });

          // Add transcript if there's content
          if (data.transcript) {
            const newEntry: TranscriptEntry = {
              slideNumber,
              text: data.transcript,
              timestamp: new Date()
            };
            
            setTranscripts(prev => {
              const updated = [...prev, newEntry];
              onTranscriptUpdate?.(updated);
              return updated;
            });
          }

          setIsTranscribing(false);
        } else if (data.status === 'RUNNING') {
          // Continue polling
          console.log(`Transcription still in progress for slide ${slideNumber}...`);
        }
      } catch (error) {
        console.error('Error polling operation status:', error);
        clearInterval(pollInterval);
        pollingIntervalsRef.current.delete(operationName);
        
        // Remove from pending operations
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          newMap.delete(operationName);
          return newMap;
        });
        
        onError?.(error instanceof Error ? error.message : 'Failed to check transcription status');
        setIsTranscribing(false);
      }
    }, 2000); // Poll every 2 seconds

    // Store the interval reference
    pollingIntervalsRef.current.set(operationName, pollInterval);
  }, [onTranscriptUpdate, onError]);

  const transcribeAudio = useCallback(async (slideNumberForThisTranscript: number) => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsTranscribing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          slideNumber: slideNumberForThisTranscript,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.error?.includes('Sync input too long')) {
          onError?.('Audio segment is too long (over 1 minute). Please pause more frequently to transcribe long-running speech.');
          return;
        }
        
        // If credentials are not set, provide a helpful message
        if (response.status === 401 && errorData.error?.includes('credentials')) {
          onError?.('Google Cloud. Please set up GOOGLE_CREDENTIALS_BASE64 environment variable. See TRANSCRIPTION_SETUP.md for instructions.');
          return;
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.isAsync && data.operationName) {
          // Handle async transcription
          setPendingOperations(prev => new Map(prev).set(data.operationName, slideNumberForThisTranscript));
          await pollOperationStatus(data.operationName, slideNumberForThisTranscript);
        } else if (data.transcript) {
          // Handle sync transcription
          const newEntry: TranscriptEntry = {
            slideNumber: slideNumberForThisTranscript,
            text: data.transcript,
            timestamp: new Date()
          };
          
          setTranscripts(prev => {
            const updated = [...prev, newEntry];
            onTranscriptUpdate?.(updated);
            return updated;
          });
          
          setIsTranscribing(false);
        }
      }
      
    } catch (error) {
      console.error('Transcription error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio');
      setIsTranscribing(false);
    } finally {
      audioChunksRef.current = [];
    }
  }, [onTranscriptUpdate, onError, pollOperationStatus]);

  const initializeRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // This is now the key part for synchronization
        // It's set once, but the logic inside transcribeAudio uses the passed slide number
      };
      
    } catch (error) {
      console.error('Error initializing audio recording:', error);
      onError?.('Failed to access microphone. Please check permissions.');
    }
  }, [onError]);

  // Start recording for a specific slide
  const startRecording = useCallback(async (slideNumber: number) => {
    if (!mediaRecorderRef.current) {
      await initializeRecording();
    }
    
    if (mediaRecorderRef.current) {
      // Set the onstop handler each time we start, to capture the correct slide number
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          await transcribeAudio(slideNumber);
        }
        setRecordingSlideNumber(null);

        // If a promise is waiting to be resolved, resolve it now.
        if (onStopPromiseResolverRef.current) {
          onStopPromiseResolverRef.current();
          onStopPromiseResolverRef.current = null;
        }
      };

      if (mediaRecorderRef.current.state === 'inactive') {
        setCurrentSlide(slideNumber);
        setRecordingSlideNumber(slideNumber);
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    }
  }, [initializeRecording, transcribeAudio]);

  // Stop recording and transcribe
  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        // Store the resolver. It will be called by the onstop handler.
        onStopPromiseResolverRef.current = resolve;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        // If not recording, resolve immediately.
        resolve();
      }
    });
  }, []);

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Clear all transcripts
  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    onTranscriptUpdate?.([]);
  }, [onTranscriptUpdate]);

  // Get transcript for a specific slide
  const getSlideTranscript = useCallback((slideNumber: number) => {
    return transcripts
      .filter(entry => entry.slideNumber === slideNumber)
      .map(entry => entry.text)
      .join(' ');
  }, [transcripts]);

  const getFormattedTranscript = useCallback(() => {
    const slideGroups = transcripts.reduce((acc, entry) => {
      if (!acc[entry.slideNumber]) {
        acc[entry.slideNumber] = [];
      }
      acc[entry.slideNumber].push(entry.text);
      return acc;
    }, {} as Record<number, string[]>);
    
    return Object.entries(slideGroups)
      .map(([slideNum, texts]) => `Slide ${slideNum}:\n"${texts.join(' ')}"`)
      .join('\n\n');
  }, [transcripts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clear all polling intervals
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcripts,
    currentSlide,
    recordingSlideNumber,
    pendingOperations,
    startRecording,
    stopRecording,
    clearTranscripts,
    getSlideTranscript,
    getFormattedTranscript,
    initializeRecording
  };
} 