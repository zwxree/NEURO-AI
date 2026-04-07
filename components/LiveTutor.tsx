import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, Video, Square } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function LiveTutor() {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  const startTutor = async () => {
    try {
      setStatus('Connecting...');
      
      // 1. Get Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 2. Setup Audio Context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: {
            parts: [{
              text: "You are a friendly, encouraging computer science tutor teaching basic concepts like variables, loops, and functions. You can see the user through their webcam. 1. If the user looks confused, stuck, or frustrated, immediately pause your current explanation and offer a simpler, relatable everyday example. 2. If the user looks away from the screen or seems distracted, stop teaching and politely remind them to look at the screen. 3. Keep your responses brief, conversational, and interactive. Start by asking what basic CS concept they want to learn today."
            }]
          }
        },
        callbacks: {
          onopen: () => {
            setStatus('Active');
            setIsActive(true);
            
            // Start Audio Capture
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            source.connect(processor);
            processor.connect(audioCtx.destination);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true);
              }
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ audio: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };

            // Start Video Capture (1 frame per second)
            videoIntervalRef.current = setInterval(() => {
              if (videoRef.current && canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  canvas.width = videoRef.current.videoWidth;
                  canvas.height = videoRef.current.videoHeight;
                  ctx.drawImage(videoRef.current, 0, 0);
                  const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ video: { data: base64, mimeType: 'image/jpeg' } });
                  });
                }
              }
            }, 1000);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current = [];
              if (audioCtxRef.current) {
                nextPlayTimeRef.current = audioCtxRef.current.currentTime;
              }
            }
            
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioCtxRef.current) {
              const binary = atob(base64Audio);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768;
              }
              
              const audioBuffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);
              
              const source = audioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtxRef.current.destination);
              
              const startTime = Math.max(nextPlayTimeRef.current, audioCtxRef.current.currentTime);
              source.start(startTime);
              nextPlayTimeRef.current = startTime + audioBuffer.duration;
              
              activeSourcesRef.current.push(source);
              source.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
              };
            }
          },
          onclose: () => {
            setStatus('Disconnected');
            stopTutor();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setStatus('Error');
            stopTutor();
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start tutor:", err);
      setStatus('Error accessing media');
    }
  };

  const stopTutor = () => {
    setIsActive(false);
    setStatus('Idle');
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    
    activeSourcesRef.current = [];
  };

  useEffect(() => {
    return () => {
      stopTutor();
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-800 mb-4">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <Video className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300 font-bold">Camera Offline</p>
            </div>
          </div>
        )}
        
        {isActive && (
          <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            LIVE TUTOR ACTIVE
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg border-2 border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : status.includes('Error') ? 'bg-red-500' : 'bg-slate-400'}`} />
          <span className="font-bold text-sm uppercase">{status}</span>
        </div>
        
        <button
          onClick={isActive ? stopTutor : startTutor}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-colors shadow-md ${
            isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isActive ? (
            <>
              <Square className="w-5 h-5" fill="currentColor" />
              Stop Session
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Voice Tutor
            </>
          )}
        </button>
      </div>
    </div>
  );
}
