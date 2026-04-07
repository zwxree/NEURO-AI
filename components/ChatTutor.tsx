import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Send, Image as ImageIcon, Video as VideoIcon, Loader2, Camera } from 'lucide-react';

declare global {
  interface Window {
    aistudio: any;
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  isGeneratingMedia?: boolean;
}

const generateImageTool: FunctionDeclaration = {
  name: "generateImage",
  description: "Generate an image to visually explain a concept.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "Detailed prompt for the image generation." }
    },
    required: ["prompt"]
  }
};

const generateVideoTool: FunctionDeclaration = {
  name: "generateVideo",
  description: "Generate a short video to visually explain a dynamic concept.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "Detailed prompt for the video generation." }
    },
    required: ["prompt"]
  }
};

export default function ChatTutor() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your visual Chat Tutor. I can see your expressions and generate images or videos to help explain concepts. What would you like to learn today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Assume true initially, check later for video

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for API key for video generation
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();

    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
      }
    }
    return null;
  };

  const handleGenerateImage = async (prompt: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });
      
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    }
    return null;
  };

  const handleGenerateVideo = async (prompt: string) => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Re-init AI with new key if needed, or assume process.env.API_KEY is updated
      }
    }

    try {
      // Need a fresh instance for video generation to pick up the selected API key
      const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      let operation = await videoAi.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await videoAi.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
          },
        });
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.error("Video generation failed:", err);
    }
    return null;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    const frameBase64 = captureFrame();
    
    const parts: any[] = [{ text: userText }];
    if (frameBase64) {
      parts.push({
        inlineData: { data: frameBase64, mimeType: 'image/jpeg' }
      });
    }

    try {
      // Build conversation history
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...history, { role: 'user', parts }],
        config: {
          systemInstruction: "You are a visual, highly adaptive computer science tutor. You can see the user's facial expression in the provided image. If they look confused, adjust your tone, provide a simpler explanation, and generate a visual aid. You can generate images and videos to explain concepts visually. Use the `generateImage` and `generateVideo` tools when a visual aid would help explain a concept (e.g., memory allocation, loops, data structures). Be interestingly curious and grab their attention. Keep text responses concise.",
          tools: [{ functionDeclarations: [generateImageTool, generateVideoTool] }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      let responseText = response.text || "";
      let newMessages: Message[] = [];

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'generateImage') {
            const prompt = call.args?.prompt as string;
            setMessages(prev => [...prev, { role: 'model', text: `Generating an image to explain: ${prompt}...`, isGeneratingMedia: true }]);
            const imageUrl = await handleGenerateImage(prompt);
            if (imageUrl) {
              newMessages.push({ role: 'model', text: "Here is a visual representation:", imageUrl });
            }
          } else if (call.name === 'generateVideo') {
            const prompt = call.args?.prompt as string;
            setMessages(prev => [...prev, { role: 'model', text: `Generating a video to explain: ${prompt}... (This may take a few minutes)`, isGeneratingMedia: true }]);
            const videoUrl = await handleGenerateVideo(prompt);
            if (videoUrl) {
              newMessages.push({ role: 'model', text: "Watch this video explanation:", videoUrl });
            } else {
              newMessages.push({ role: 'model', text: "Sorry, I couldn't generate the video right now." });
            }
          }
        }

        // We need to send the tool response back to get the final text if it wasn't provided
        if (!responseText) {
           const nextResponse = await ai.models.generateContent({
             model: "gemini-3-flash-preview",
             contents: [...history, { role: 'user', parts }, response.candidates?.[0]?.content || { role: 'model', parts: [] }, { role: 'user', parts: [{ text: "Tool executed. Please continue your explanation." }] }],
             config: {
               systemInstruction: "You are a visual, highly adaptive computer science tutor. You can see the user's facial expression in the provided image. If they look confused, adjust your tone, provide a simpler explanation, and generate a visual aid. You can generate images and videos to explain concepts visually. Use the `generateImage` and `generateVideo` tools when a visual aid would help explain a concept (e.g., memory allocation, loops, data structures). Be interestingly curious and grab their attention. Keep text responses concise.",
             }
           });
           responseText = nextResponse.text || "Here you go!";
        }
      }

      // Remove the "Generating..." placeholder messages
      setMessages(prev => prev.filter(m => !m.isGeneratingMedia));

      if (responseText) {
        setMessages(prev => [...prev, { role: 'model', text: responseText }, ...newMessages]);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }

    } catch (err: any) {
      console.error("Chat error:", err);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.status === 'RESOURCE_EXHAUSTED') {
        errorMessage = "API Quota Exceeded. Please check your plan and billing details at https://ai.google.dev/gemini-api/docs/rate-limits.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 rounded-lg overflow-hidden border-2 border-slate-200">
      {/* Header & Camera */}
      <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
        <h2 className="font-bold flex items-center gap-2"><Camera className="w-5 h-5" /> Visual Chat Tutor</h2>
        <div className="w-32 h-24 bg-black rounded overflow-hidden border-2 border-slate-600 relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Camera Off</div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Generated visual aid" className="mt-2 rounded-md w-full object-cover border border-slate-200" />
              )}
              {msg.videoUrl && (
                <video src={msg.videoUrl} controls autoPlay loop className="mt-2 rounded-md w-full border border-slate-200" />
              )}
              {msg.isGeneratingMedia && (
                <div className="flex items-center gap-2 mt-2 text-blue-500 text-sm font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating media...
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && !messages.some(m => m.isGeneratingMedia) && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
            className="flex-1 p-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
