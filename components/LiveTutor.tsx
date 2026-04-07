import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Mic, Video, Square, ShieldAlert } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const showDiagramTool: FunctionDeclaration = {
  name: "showDiagram",
  description: "Show a visual diagram to the user on the right page when they ask about memory allocation or pointers.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      diagramName: { type: Type.STRING, description: "The name of the diagram to show. Currently supported: 'memory_allocation'" }
    },
    required: ["diagramName"]
  }
};

interface LiveTutorProps {
  onShowDiagram: (diagramName: string | null) => void;
  onCaptionsUpdate: (text: string) => void;
}

export default function LiveTutor({ onShowDiagram, onCaptionsUpdate }: LiveTutorProps) {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [currentMood, setCurrentMood] = useState('Analyzing...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moodIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  const analyzeMood = async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: [
          { inlineData: { data: base64, mimeType: 'image/jpeg' } },
          { text: "Analyze the facial expression of the person in this image. Respond with ONLY ONE WORD describing their mood or state (e.g., Confused, Focused, Happy, Distracted, Frustrated, Neutral)." }
        ]
      });
      if (response.text) {
        setCurrentMood(response.text.trim());
      }
    } catch (err) {
      console.error("Mood analysis failed:", err);
    }
  };

  const startTutor = async () => {
    try {
      setStatus('Connecting...');
      onCaptionsUpdate("Connecting to AI Tutor...");
      onShowDiagram(null);
      
      // 1. Get Media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }, 
        video: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 2. Setup Audio Context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioCtx.resume();
      audioCtxRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          tools: [{ functionDeclarations: [showDiagramTool] }],
          systemInstruction: "You are a friendly, highly adaptive computer science tutor. Your core philosophy is: 'If the student can't learn the way we teach, we teach the way they learn.' You can see the user through their webcam. 1. ALWAYS use highly visual, descriptive language (e.g., 'picture a series of boxes', 'imagine a branching tree') and highly relatable, everyday examples (like video games, cooking, or sports) to explain concepts. 2. If the user looks confused, stuck, or frustrated, immediately pause and switch to a completely different, even simpler visual analogy. 3. If the user looks away or seems distracted, gently bring their attention back to the screen. 4. Keep responses brief, conversational, and interactive. Start by asking what basic CS concept they want to learn today and what their favorite hobby is so you can tailor your examples to them! 5. If the user asks about memory allocation, pointers, or RAM, call the `showDiagram` tool with diagramName 'memory_allocation' to show them a visual diagram on the right page."
        },
        callbacks: {
          onopen: () => {
            setStatus('Active');
            setIsActive(true);
            
            // Trigger initial greeting
            sessionPromise.then(session => {
              session.sendRealtimeInput({ text: "Hello! I'm ready to learn." });
            });

            // Start Audio Capture
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            // Create a dummy gain node to prevent microphone feedback loop
            const dummyGain = audioCtx.createGain();
            dummyGain.gain.value = 0;
            
            source.connect(processor);
            processor.connect(dummyGain);
            dummyGain.connect(audioCtx.destination);
            
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

            // Start Video Capture (1 frame per second for Live API)
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

            // Start Mood Analysis (every 3 seconds)
            moodIntervalRef.current = setInterval(analyzeMood, 3000);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current = [];
              if (audioCtxRef.current) {
                nextPlayTimeRef.current = audioCtxRef.current.currentTime;
              }
            }

            // Handle tool calls
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              for (const call of toolCalls) {
                if (call.name === 'showDiagram') {
                  const diagramName = call.args?.diagramName as string;
                  onShowDiagram(diagramName);
                  
                  // Send tool response back
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "Diagram shown successfully." }
                      }]
                    });
                  });
                }
              }
            }

            // Handle transcriptions for captions
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) {
                  onCaptionsUpdate(part.text);
                }
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
    setCurrentMood('Analyzing...');
    onCaptionsUpdate("Tutor disconnected.");
    
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    if (moodIntervalRef.current) {
      clearInterval(moodIntervalRef.current);
      moodIntervalRef.current = null;
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
      <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-800 mb-2">
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
          <>
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-2 shadow-md">
              <div className="w-2 h-2 bg-white rounded-full" />
              LIVE TUTOR ACTIVE
            </div>
            <div className="absolute top-4 right-4 bg-slate-800/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-slate-600">
              Mood: <span className="text-amber-400">{currentMood}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-4 px-2">
        <ShieldAlert className="w-3 h-3" />
        <p>Privacy Disclaimer: None of your camera data is saved. It is only used for real-time expression detection to adapt the teaching style.</p>
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
