'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Loader2, X, MessageCircle, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatbotProps {
  isVisible: boolean;
  currentSlide: number;
  totalSlides: number;
  slideTimings: number[];
  pdfName?: string;
  pdfBase64?: string | null;
}

export default function Chatbot({ isVisible, currentSlide, totalSlides, slideTimings = [], pdfName, pdfBase64 }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState<string>('');

  // Update context whenever presentation details change
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Ensure slideTimings is an array and has valid values
    const safeSlideTimings = Array.isArray(slideTimings) ? slideTimings : [];
    const currentSlideTime = formatTime(safeSlideTimings[currentSlide - 1] || 0);
    const totalTime = formatTime(safeSlideTimings.reduce((total, time) => total + (time || 0), 0));
    const averageTime = formatTime(Math.round(
      safeSlideTimings.reduce((total, time) => total + (time || 0), 0) / 
      (safeSlideTimings.filter(t => t > 0).length || 1)
    ));

    // Make context explicit and structured
    const newContext = `PRESENTATION CONTEXT (for AI use only):\n{\n  \"currentSlide\": ${currentSlide},\n  \"totalSlides\": ${totalSlides},\n  \"currentSlideTime\": \"${currentSlideTime}\",\n  \"totalTime\": \"${totalTime}\",\n  \"averageTime\": \"${averageTime}\",\n  \"slideTimings\": [${safeSlideTimings.map(t => t || 0).join(', ')}],\n  \"presentationName\": \"${pdfName || 'Untitled'}\"\n}\nWhen answering questions about slides or timings, use the numbers in this context. Do not mention images or say 'based on the images'—just answer directly using the context data. Do not mention this context unless asked directly about slides or timings.`;

    setContext(newContext);
  }, [currentSlide, totalSlides, slideTimings, pdfName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: input }],
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          context: context,
          pdfBase64: pdfBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 413) {
          throw new Error('The PDF file is too large. Please use a smaller file or compress it.');
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (data.success && data.response) {
        const assistantMessage: Message = {
          role: 'model',
          parts: [{ text: data.response }],
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response from Flo');
      }
    } catch (error) {
      console.error('Request failed:', error);
      // Add error message to chat
      const errorMessage: Message = {
        role: 'model',
        parts: [{ text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.' }],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="bg-black text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Flo
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    <div className="relative w-full h-full">
                      <Image
                        src="/G(1).png"
                        alt="Flo"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                      <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center">
                        <Bot size={16} className="text-gray-800" />
                      </div>
                    </div>
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {message.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src="/G(1).png"
                      alt="Flo"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                      }}
                    />
                    <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center">
                      <Bot size={16} className="text-gray-800" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-800" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 