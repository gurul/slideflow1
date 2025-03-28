"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, Edit, Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react"

export function PresentationUi() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState("00:00:00")
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef(null)
  
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  const startTimer = () => {
    if (timerRef.current) return
    
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1
        setCurrentTime(formatTime(newSeconds))
        return newSeconds
      })
    }, 1000)
  }
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const timeItems = [
    { id: 1, time: "00:10:00", difference: "-1:91" },
    { id: 2, time: "00:09:35", difference: "+2:13" },
    ...Array.from({ length: 7 }, (_, i) => ({ id: i + 3, time: "", difference: "" })),
  ]

  return (
    (<div className="w-full mx-auto px-5 mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Present
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Speaker View</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-4 col-span-3 h-full">
          <div className="border rounded-lg h-full p-4 flex flex-col">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="icon">
                <Maximize2 className="h-4 w-4"/>
              </Button>
            </div>
            <div
                className="flex-grow flex items-center justify-center bg-gray-100 rounded-lg min-h-[200px]">
              <span className="text-2xl text-gray-400">Current Slide</span>
            </div>
            <div className="flex items-center mt-4 justify-center space-x-2">
              <Button variant="outline" size="icon">
                <SkipBack className="h-4 w-4"/>
              </Button>
              <Button variant="outline" size="icon" onClick={() => {
                const newIsPlaying = !isPlaying
                setIsPlaying(newIsPlaying)
                if (newIsPlaying) {
                  startTimer()
                } else {
                  stopTimer()
                }
              }}>
                {isPlaying ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
              </Button>
              <Button variant="outline" size="icon">
                <SkipForward className="h-4 w-4"/>
              </Button>
              <Input value={currentTime} readOnly className="w-24 h-9"/>
            </div>
          </div>

        </div>
        <div className="border rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            {timeItems.map((item) => (
                <div
                    key={item.id}
                    className="grid grid-cols-[auto,1fr,auto] gap-2 items-center">
                  <span className="text-sm font-medium">{item.id}</span>
                  <div className="grid grid-cols-2 px-3 py-2 border h-10 border-black/40 rounded-md">
                    <div className="text-left border-right border-black">
                      {item.time}
                    </div>
                    <div className="text-center h-full">
                      <span
                          className={`text-sm ${item.difference.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                    {item.difference}
                  </span>
                    </div>
                  </div>
                  {/*<Input value={item.time} readOnly className="h-8" />*/}

                </div>
              ))}
            </div>
          <Button variant="outline" size="sm" className="w-full">
            Reset all
          </Button>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <Textarea placeholder="Click to add speaker notes" className="min-h-[100px]" />
      </div>
    </div>)
  );
}
