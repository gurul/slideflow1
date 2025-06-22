"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CloudIcon, Loader2Icon } from "lucide-react"
import { compressPDFToBase64, getFileSizeInMB, compressPDFWithFallback, compressPDFToTargetSize } from "@/lib/pdfCompression"

export function UploadModal({isOpen, setIsOpen, uploadAndConvertPDF}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState("")

  const handleFile = useCallback(async (file) => {
    console.log("File name:", file.name)
    console.log(`Original file size: ${getFileSizeInMB(file).toFixed(2)} MB`)
    
    setIsUploading(true)
    setUploadStatus("Compressing PDF to under 4MB...")
    
    try {
      // Use target size compression to ensure file is under 4MB
      const compressedBlob = await compressPDFToTargetSize(file);
      const compressedSizeMB = compressedBlob.size / (1024 * 1024);
      
      if (compressedSizeMB > 4) {
        throw new Error(`File could not be compressed to under 4MB. Current size: ${compressedSizeMB.toFixed(2)} MB. Please try a smaller file.`);
      }
      
      setUploadStatus("Uploading compressed PDF...")
      
      // Create a compressed file object for the upload function
      const compressedFile = new File([compressedBlob], file.name, { type: 'application/pdf' });
      
      console.log(`Compressed file size: ${compressedSizeMB.toFixed(2)} MB`)
      
      // Call the upload function with the compressed file
      await uploadAndConvertPDF(compressedFile);
    } catch (error) {
      console.error('Error compressing/uploading PDF:', error);
      setUploadStatus("Error: " + (error.message || 'Failed to process PDF'));
      setIsUploading(false);
    }
  }, [uploadAndConvertPDF])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOut = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFile(file)
      e.dataTransfer.clearData()
    }
  }, [handleFile])

  const handleChange = useCallback((e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      handleFile(file)
    }
  }, [handleFile])

  return (
    (<Dialog open={isOpen}>
      {/*<DialogTrigger asChild>*/}
      {/*  <Button variant="outline">Open Upload Modal</Button>*/}
      {/*</DialogTrigger>*/}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold">
            Let&apos;s start practicing.
          </DialogTitle>
          <DialogDescription className="text-center">
            Begin by uploading a PDF version of your slideshow.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-all duration-300 ${
              isUploading
                ? "border-blue-500 bg-blue-500 text-white"
                : isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}>
            {isUploading ? (
              <>
                <Loader2Icon className="h-12 w-12 animate-spin" />
                <p className="mt-4 text-lg font-semibold">Uploading...</p>
                {uploadStatus && (
                  <p className="mt-2 text-sm opacity-80">{uploadStatus}</p>
                )}
              </>
            ) : (
              <>
                <CloudIcon
                  className={`mx-auto h-12 w-12 ${isUploading ? "'text-white'" : "'text-blue-500'"}`} />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                    <span>Choose File</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleChange}
                      accept=".pdf" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PDF up to 4MB (will be compressed automatically)</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>)
  );
}
