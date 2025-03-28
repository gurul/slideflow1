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

export function UploadModal({isOpen, setIsOpen, uploadAndConvertPDF}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file) => {
    console.log("File name:", file.name)
    setIsUploading(true)
    // Simulating upload process
    uploadAndConvertPDF(file)
  }, [])

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
                <p className="text-xs leading-5 text-gray-600">PDF up to 10MB</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>)
  );
}
