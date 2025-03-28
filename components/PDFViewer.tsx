'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface PDFViewerProps {
  file: File;
  currentPage: number;
  onTotalPagesFound?: (total: number) => void;
}

function PDFViewer({ file, currentPage, onTotalPagesFound }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [scale, setScale] = useState(1.5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const renderingRef = useRef<boolean>(false);
  const [pdfLib, setPdfLib] = useState<any>(null);

  // Load PDF.js library (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip SSR

    const loadLibrary = async () => {
      try {
        // Dynamic import will be resolved only on client
        const pdfjs = await import('pdfjs-dist');
        // Initialize worker
        pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;
        setPdfLib(pdfjs);
      } catch (err) {
        console.error('Error loading PDF library:', err);
        setError('Failed to load PDF library. Please try again.');
      }
    };

    loadLibrary();
  }, []);

  // Then load the PDF file once the library is loaded
  useEffect(() => {
    if (!pdfLib || !file) return;
    
    const loadPDF = async () => {
      try {
        setError(null);
        setLoading(true);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
        setPdf(pdf);
        
        if (onTotalPagesFound) {
          onTotalPagesFound(pdf.numPages);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF. Please try again.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [file, pdfLib, onTotalPagesFound]);

  // Render the current page when pdf or currentPage changes
  useEffect(() => {
    if (!pdf || !canvasRef.current || renderingRef.current || !pdfLib) return;

    const renderPage = async () => {
      try {
        // Set rendering flag to prevent multiple simultaneous renders
        renderingRef.current = true;
        setError(null);
        
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Clear rendering flag
        renderingRef.current = false;
      } catch (error) {
        console.error('Error rendering page:', error);
        setError('Failed to render PDF page. Please try again.');
        renderingRef.current = false;
      }
    };

    renderPage();
  }, [pdf, currentPage, scale, pdfLib]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (loading || !pdfLib) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="animate-pulse">Loading PDF...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto shadow-lg rounded-lg"
      />
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PDFViewer, (prevProps, nextProps) => {
  // Only re-render if file or currentPage changes
  return (
    prevProps.file === nextProps.file && 
    prevProps.currentPage === nextProps.currentPage
  );
}); 