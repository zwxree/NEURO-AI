"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, PlayCircle, CheckCircle, ArrowLeft, Sparkles, MessageSquare, Send, User as UserIcon, Brain } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, saveUserPreferences, addExplorationHistory } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function LearnView({ onBack, userId, initialModule }: { onBack: () => void, userId: string | null, initialModule?: string | null }) {
  const [selectedModule, setSelectedModule] = useState<string | null>(initialModule || null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [showAiTutor, setShowAiTutor] = useState(false);
  const [userPrefs, setUserPrefs] = useState<{ level: string, interests: string } | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.preferences) {
          setUserPrefs(data.preferences);
        }
      }
    });
    return () => unsubscribe();
  }, [userId]);

  const modules = [
    { id: 'math', title: 'Mathematics', levels: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate'], desc: 'Calculus, Algebra, and Geometry', progress: 80 },
    { id: 'physics', title: 'Physics', levels: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate'], desc: 'Mechanics, Thermodynamics, and Quantum Theory', progress: 45 },
    { id: 'chemistry', title: 'Chemistry', levels: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate'], desc: 'Organic, Inorganic, and Physical Chemistry', progress: 10 },
    { id: 'biology', title: 'Biology', levels: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate'], desc: 'Genetics, Evolution, and Cell Biology', progress: 0 },
    { id: 'cs', title: 'Computer Science', levels: ['Class 10', 'Class 11', 'Class 12', 'Undergraduate'], desc: 'Algorithms, Data Structures, and AI', progress: 100 },
    { id: 'eng', title: 'Engineering', levels: ['Undergraduate'], desc: 'Electrical, Mechanical, and Civil', progress: 25 },
  ];

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !userId || isAiLoading) return;

    const userMessage = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const prompt = `
        You are a personalized STEM tutor. 
        User Level: ${userPrefs?.level || 'Unknown'}
        User Interests: ${userPrefs?.interests || 'None specified'}
        
        Context: The user is asking about a STEM topic. 
        Your goal is to explain it practically and adapt to their interests (e.g., using their favorite movie/comic characters if specified).
        Avoid overly theoretical explanations; focus on intuition and practical examples.
        
        User Question: ${userMessage}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const aiText = response.text || "I'm sorry, I couldn't generate a response.";
      setAiMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      addExplorationHistory(userId, `AI Tutor: ${userMessage.substring(0, 30)}...`);
    } catch (error) {
      console.error("AI Tutor Error:", error);
      setAiMessages(prev => [...prev, { role: 'ai', content: "Error connecting to the AI tutor. Please try again later." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const savePrefs = async (level: string, interests: string) => {
    if (!userId) return;
    await saveUserPreferences(userId, { level, interests });
    setUserPrefs({ level, interests });
  };

  if (showAiTutor) {
    if (!userId) {
      return (
        <div className="flex flex-col h-[80vh] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setShowAiTutor(false)} className="p-3 glass-button">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white">AI Tutor</h2>
          </div>
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto">
            <UserIcon className="w-16 h-16 text-white/20" />
            <h3 className="text-2xl font-bold text-white">Sign In Required</h3>
            <p className="text-white/60">Please sign in to your profile to use the Personalized AI Tutor. This allows us to save your learning preferences and track your progress locally.</p>
            <button onClick={onBack} className="glass-button px-8 py-4 bg-blue-500/20 border-blue-500/30 text-blue-300">
              Go to Profile
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-[80vh] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAiTutor(false)} className="p-3 glass-button">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              Personalized AI Tutor
            </h2>
          </div>
          {userPrefs && (
            <button 
              onClick={() => setUserPrefs(null)}
              className="text-xs font-bold tracking-widest text-white/40 hover:text-white/60 transition-colors"
            >
              RESET PREFERENCES
            </button>
          )}
        </div>

        {!userPrefs ? (
          <div className="glass-panel p-8 flex flex-col gap-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white">Personalize Your Learning</h3>
            <p className="text-white/60">Tell me a bit about yourself so I can adapt my teaching style to you.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white/50 mb-2">YOUR LEVEL</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Class 10', 'Class 11', 'Class 12', 'Undergraduate'].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => setAiInput(lvl)}
                      className={`p-3 rounded-xl border transition-all ${aiInput === lvl ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-white/50 mb-2">YOUR INTERESTS (Movies, Comics, Hobbies)</label>
                <input 
                  type="text"
                  placeholder="e.g. Marvel, Harry Potter, Coding, Space"
                  className="w-full glass-input p-4"
                  id="interests-input"
                />
              </div>
              <button 
                onClick={() => {
                  const interests = (document.getElementById('interests-input') as HTMLInputElement).value;
                  if (aiInput && interests) savePrefs(aiInput, interests);
                }}
                className="w-full glass-button py-4 bg-blue-500/20 border-blue-500/30 text-blue-300"
              >
                Start Personalized Learning
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col glass-panel overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {aiMessages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">How can I help you today?</h3>
                  <p className="text-white/50">I&apos;ll explain any STEM topic using your interest in {userPrefs.interests}.</p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${msg.role === 'user' ? 'bg-blue-500/20 border border-blue-500/30 text-white' : 'bg-white/10 border border-white/20 text-white/90'}`}>
                    {msg.role === 'ai' && <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 p-4 rounded-2xl animate-pulse flex gap-2">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleAiSubmit} className="p-6 border-t border-white/10 flex gap-4">
              <input 
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask me anything about STEM..."
                className="flex-1 glass-input p-4"
              />
              <button type="submit" className="p-4 glass-button" disabled={isAiLoading}>
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (selectedModule) {
    const mod = modules.find(m => m.id === selectedModule);
    return (
      <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedModule(null)} className="p-3 glass-button">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-2xl font-bold text-white">{mod?.title} Module</h2>
          </div>
          <button 
            onClick={() => setShowAiTutor(true)}
            className="glass-button px-6 py-3 bg-yellow-500/10 border-yellow-500/20 text-yellow-400 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI Tutor
          </button>
        </div>

        <div className="glass-panel p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-8 h-8 text-white/70" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{mod?.title} Fundamentals</h3>
              <p className="text-white/60">{mod?.desc}</p>
              <div className="flex gap-2 mt-2">
                {mod?.levels.map(lvl => (
                  <span key={lvl} className="text-[10px] font-bold tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded-md text-white/40 uppercase">{lvl}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((lesson) => (
              <div 
                key={lesson} 
                onClick={() => setActiveLesson(lesson)}
                className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lesson === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/40 border border-white/20'}`}>
                    {lesson === 1 ? <CheckCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5 group-hover:text-white/80 transition-colors" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Lesson {lesson}: Core Principles</h4>
                    <p className="text-sm text-white/50">15 mins • Video & Reading</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Lesson Modal */}
        {activeLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-panel w-full max-w-2xl p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Lesson {activeLesson}: Core Principles</h3>
                  <p className="text-white/60">Watch the video and complete the reading assignment.</p>
                </div>
                <button onClick={() => setActiveLesson(null)} className="p-2 glass-button">
                  <ChevronRight className="w-6 h-6 text-white rotate-180" />
                </button>
              </div>
              
              <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/30" />
              </div>
              
              <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => setActiveLesson(null)} className="px-6 py-3 glass-button">
                  Close
                </button>
                <button onClick={() => setActiveLesson(null)} className="px-6 py-3 glass-button bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30">
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Study Modules</h2>
          <p className="text-white/60">Select a discipline to begin learning.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowAiTutor(true)}
            className="glass-button px-6 py-3 bg-yellow-500/10 border-yellow-500/20 text-yellow-400 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI Tutor
          </button>
          <button onClick={onBack} className="px-6 py-3 glass-button">
            Back to Home
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <div 
            key={mod.id}
            onClick={() => setSelectedModule(mod.id)}
            className="glass-panel p-6 cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <BookOpen className="w-6 h-6 text-white/70" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white/60">{mod.progress}%</span>
                <div className="w-8 h-8 rounded-full glass-button group-hover:bg-white/20">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{mod.title}</h3>
            <p className="text-sm text-white/50 mb-4">{mod.desc}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {mod.levels.map(lvl => (
                <span key={lvl} className="text-[9px] font-bold tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/30 uppercase">{lvl}</span>
              ))}
            </div>
            
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-white/40 rounded-full transition-all duration-1000"
                style={{ width: `${mod.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
