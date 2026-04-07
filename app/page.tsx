"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  BookOpen,
  Camera,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Home,
  Map as MapIcon,
  User,
  HelpCircle,
  Hand,
  Mic,
  Video,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { auth, addExplorationHistory, signInWithGoogle, logOut, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import InteractiveBrain from '../components/InteractiveBrain';
import LiveTutor from '../components/LiveTutor';
import NeuroBot from '../components/NeuroBot';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export default function NeuroLearningBook() {
  const [activeTab, setActiveTab] = useState('Index');
  const [userId, setUserId] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(122);
  const [expression, setExpression] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [complexity, setComplexity] = useState(50);
  const [userData, setUserData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const facts = [
    "The first computer bug was an actual real-life moth found in a Harvard Mark II computer in 1947!",
    "Variables are like labeled boxes where you can store information to use later.",
    "A loop allows you to repeat a block of code multiple times without rewriting it.",
    "Functions are reusable blocks of code that perform a specific task.",
    "An array is a special variable that can hold more than one value at a time.",
    "Boolean logic, the foundation of modern computing, only uses True and False (1 and 0).",
    "Algorithms are just step-by-step instructions for solving a problem or completing a task."
  ];

  useEffect(() => {
    setCurrentFactIndex(Math.floor(Math.random() * facts.length));
    setPageNumber(prev => prev + 2);
  }, [activeTab, facts.length]);

  const indexItems = [
    { title: '1. Variables & Data', subtitle: '(CS Basics: Storing Info)' },
    { title: '2. Control Flow', subtitle: '(CS Basics: If/Else Statements)' },
    { title: '3. Loops', subtitle: '(CS Basics: For & While)' },
    { title: '4. Functions', subtitle: '(CS Basics: Reusable Code)' },
    { title: '5. Arrays & Lists', subtitle: '(CS Basics: Collections)' },
    { title: '6. Basic Objects', subtitle: '(CS Basics: Key-Value Pairs)' },
  ];

  const filteredIndex = indexItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: 'Index', label: 'Index' },
    { id: 'Learning Corner', label: 'Learning Corner' },
    { id: 'Syllabus', label: 'Syllabus' },
    { id: 'Video Learning', label: 'Video Learning' },
    { id: 'Camera Learning', label: 'Camera Learning' },
    { id: 'Profile', label: 'Profile' }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ displayName: user.displayName, email: user.email, stats: { studyTime: 0, questionsAsked: 0 } });
          }
        });
        return () => unsubDoc();
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Camera and Expression Detection Logic
  useEffect(() => {
    if (activeTab === 'Camera Learning') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeTab]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const analyzeExpression = React.useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analyze the person's facial expression in this image. Detect if they are confused, uninterested, focused, happy, or frustrated. Return only the single word that best describes their mood." },
              { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });
      setExpression(response.text?.trim() || "Unknown");
    } catch (err) {
      console.error("Error analyzing expression:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'Camera Learning') {
      interval = setInterval(analyzeExpression, 3000);
    }
    return () => clearInterval(interval);
  }, [activeTab, analyzeExpression]);

  const renderPageContent = () => {
    switch (activeTab) {
      case 'Index':
      case 'Syllabus':
        return {
          left: (
            <div className="book-page book-page-left flex-1">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold italic">Index</h1>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1 border-b-2 border-slate-300 focus:border-slate-800 outline-none handwritten text-sm bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-6 handwritten">
                {filteredIndex.length > 0 ? (
                  filteredIndex.map((item, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-slate-300 pb-1 relative group">
                      <div className="flex items-center gap-2">
                        {i < 2 && <Sparkles className="w-4 h-4 text-amber-500 absolute -left-6" />}
                        <span>{item.title}</span>
                      </div>
                      <span className="text-sm italic">{item.subtitle}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No topics found...</p>
                )}
              </div>
              <div className="absolute bottom-8 left-12 text-xs font-bold text-slate-400">Page {pageNumber}</div>
            </div>
          ),
          right: (
            <div className="book-page book-page-right flex-1">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-2xl font-bold italic">Timeline</h2>
                <h2 className="text-2xl font-bold italic">Completion</h2>
              </div>
              <div className="space-y-8 handwritten">
                {[
                  { label: 'Completed', date: 'Jan 4, 2023', progress: 85 },
                  { label: 'Completed', date: 'Jan 2, 2023', progress: 100 },
                  { label: 'Completed', date: 'Jan 4, 2023', progress: 60 },
                  { label: 'Completed', date: 'Jan 10, 2023', progress: 40 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span>{item.date}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <motion.div 
                drag
                dragConstraints={bookRef}
                initial={{ scale: 0, rotate: 5, opacity: 0 }}
                animate={{ scale: 1, rotate: 2, opacity: 1 }}
                className="sticky-note sticky-yellow bottom-20 right-12 w-64 p-4 cursor-pointer"
              >
                <p className="handwritten text-sm italic">TIP: Use the search bar to quickly jump to specific neural architectures!</p>
              </motion.div>
              <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Page {pageNumber + 1}</span>
                <button onClick={() => setActiveTab('Learning Corner')} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                  Next Page <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        };

      case 'Learning Corner':
      case 'Video Learning':
        return {
          left: (
            <div className="book-page book-page-left flex-1">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-3xl font-bold italic">Chapter 1: Variables & Data</h1>
                  <NeuroBot mood={complexity > 70 ? 'thinking' : 'explaining'} />
                </div>
                <div className="space-y-4 handwritten text-sm leading-relaxed">
                  <p>
                    {complexity < 30 ? 
                      "A variable is like a box with a name on it. You can put things inside the box, like a number or a word, and look inside the box later." :
                      complexity < 70 ?
                      "In programming, a variable is a named memory location that stores a value. The value can change during program execution." :
                      "Variables are strongly or weakly typed identifiers bound to memory addresses. In memory-safe languages, they are strictly scoped and their allocation is managed by the compiler or garbage collector."
                    }
                  </p>
                  <div className="border-l-4 border-slate-200 pl-4 py-2 italic text-slate-500">
                    &quot;Talk is cheap. Show me the code.&quot; — Linus Torvalds
                  </div>
                  <p>
                    {complexity < 50 ?
                      "Imagine you have a jar labeled 'Cookies'. You can put 5 cookies in it. Later, you can take 2 out. The jar is the variable, and the cookies are the data!" :
                      "Variables allow developers to write flexible programs. Instead of hardcoding values, you use variables so the program can process different inputs dynamically."
                    }
                  </p>
                </div>
                
                <div className="mt-auto pt-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-slate-400">Complexity Level</span>
                    <span className="text-xs font-bold text-slate-800">{complexity}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={complexity} 
                    onChange={(e) => setComplexity(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                    <span>Simple</span>
                    <span>Detailed</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 left-12 text-xs font-bold text-slate-400">Page {pageNumber}</div>
            </div>
          ),
          right: (
            <div className="book-page book-page-right flex-1">
              <motion.div 
                drag
                dragConstraints={bookRef}
                initial={{ scale: 0, rotate: -10, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: 3, 
                  opacity: 1,
                  height: expandedNotes['learning-note'] ? 'auto' : '150px'
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
                onClick={() => toggleNote('learning-note')}
                className="sticky-note sticky-yellow bottom-20 right-12 w-64 p-6 cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="handwritten text-lg">Does speaking the words out loud enhance your long-term memory formation?</p>
                  {expandedNotes['learning-note'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <AnimatePresence>
                  {expandedNotes['learning-note'] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4"
                    >
                      <p className="handwritten text-xl font-bold">What if you explain it like a story?</p>
                      <p className="handwritten text-sm italic">Research shows that the &quot;production effect&quot;—the act of saying a word aloud—makes it more distinct in your memory.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Page {pageNumber + 1}</span>
                <button onClick={() => setActiveTab('Camera Learning')} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                  Next Page <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        };

      case 'Camera Learning':
        return {
          left: (
            <div className="book-page book-page-left flex-1">
              <h2 className="text-2xl font-bold italic mb-6">Live Voice Tutor</h2>
              <div className="w-full h-[60%]">
                <LiveTutor />
              </div>
              <div className="mt-8 border-2 border-slate-800 p-4 bg-white/50 relative">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold uppercase italic">How it works</h3>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <p className="handwritten text-xs leading-relaxed">
                  Start the voice tutor and ask a question about Computer Science! The AI will watch your expressions. If you look confused, it will automatically simplify the explanation. If you look away, it will remind you to focus!
                </p>
              </div>
              <div className="absolute bottom-8 left-12 text-xs font-bold text-slate-400">Page {pageNumber}</div>
            </div>
          ),
          right: (
            <div className="book-page book-page-right flex-1">
              <h2 className="text-2xl font-bold italic mb-6 uppercase tracking-widest text-center">3D Cortical Atlas</h2>
              <div className="relative w-full h-[60%] mb-8 flex justify-center items-center">
                <InteractiveBrain />
              </div>
              <motion.div 
                drag
                dragConstraints={bookRef}
                initial={{ scale: 0, rotate: 10, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: -2, 
                  opacity: 1,
                  height: expandedNotes['camera-note'] ? 'auto' : '120px'
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
                onClick={() => toggleNote('camera-note')}
                className="sticky-note sticky-pink bottom-20 right-8 w-56 p-4 cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="handwritten text-sm">Explore the Brain!</p>
                  {expandedNotes['camera-note'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                <AnimatePresence>
                  {expandedNotes['camera-note'] && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-2"
                    >
                      <p className="handwritten text-base font-bold">Did you know?</p>
                      <p className="handwritten text-xs italic">The Frontal Lobe is highly active when you are learning logic and programming concepts!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>Page {pageNumber + 1}</span>
                <button onClick={() => setActiveTab('Profile')} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                  Next Page <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        };

      case 'Profile':
        return {
          left: (
            <div className="book-page book-page-left flex-1">
              <h2 className="text-2xl font-bold italic mb-8">Profile</h2>
              {userId ? (
                <>
                  <div className="id-card mb-12">
                    <div className="id-photo">
                      {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase">USER:</span>
                      <span className="text-2xl font-bold italic">{userData?.displayName || 'NeuroScout'}</span>
                      <span className="text-xs text-slate-500">{userData?.email}</span>
                    </div>
                  </div>
                  <button onClick={logOut} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300 transition-colors">
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-1/2 text-center">
                  <User className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="handwritten mb-6">Sign in to save your progress and study logs!</p>
                  <button onClick={signInWithGoogle} className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-md">
                    Sign In with Google
                  </button>
                </div>
              )}
              <div className="coffee-stain bottom-20 left-20" />
              <div className="absolute bottom-8 left-12 text-xs font-bold text-slate-400">Page {pageNumber}</div>
            </div>
          ),
          right: (
            <div className="book-page book-page-right flex-1">
              <div className="space-y-8 mt-12">
                <div className="space-y-2">
                  <span className="handwritten font-bold">Variables & Data: {userId ? '65%' : '0%'}</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: userId ? '65%' : '0%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="handwritten font-bold">Control Flow: {userId ? '30%' : '0%'}</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: userId ? '30%' : '0%' }} />
                  </div>
                </div>
              </div>

              <div className="flex justify-center my-12">
                <div className={`badge-expert ${!userId && 'opacity-50 grayscale'}`}>
                  <div className="text-center">
                    <span className="text-[10px] font-bold block">Expert</span>
                    <span className="text-xs font-bold block">{userData?.displayName?.split(' ')[0] || 'Student'}</span>
                    <Sparkles className="w-4 h-4 mx-auto mt-1" />
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-800 p-6 text-center">
                <h3 className="font-bold italic border-b-2 border-slate-800 pb-2 mb-4">Study Log</h3>
                <div className="handwritten space-y-2">
                  <p>Total Study Time: {userData?.stats?.studyTime || (userId ? 120 : 0)} Hours</p>
                  <p>Questions Asked: {userData?.stats?.questionsAsked || (userId ? 55 : 0)}</p>
                </div>
              </div>
              <motion.div 
                drag
                dragConstraints={bookRef}
                initial={{ scale: 0, rotate: -5, opacity: 0 }}
                animate={{ scale: 1, rotate: -3, opacity: 1 }}
                className="sticky-note sticky-blue bottom-20 right-12 w-64 p-4 cursor-pointer"
              >
                <p className="handwritten text-sm italic">TIP: Your mastery score increases as you explore new modules!</p>
              </motion.div>
              <div className="absolute bottom-8 right-12 text-xs font-bold text-slate-400">Profile</div>
            </div>
          )
        };

      default:
        return { left: null, right: null };
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-12 flex items-center justify-center">
      <canvas ref={canvasRef} className="hidden" />
      
      <div ref={bookRef} className="book-container">
        {/* Spine */}
        <div className="book-spine" />

        {/* Tabs */}
        <div className="tab-vertical">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'tab-item-active' : ''}`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Pages with Animation */}
        <div className="flex w-full h-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              {renderPageContent().left}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${activeTab}`}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
              className="flex-1"
            >
              {renderPageContent().right}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Random Fact Sticky Note (Global) */}
      <motion.div 
        key={currentFactIndex}
        initial={{ y: 100, opacity: 0, rotate: -15 }}
        animate={{ y: 0, opacity: 1, rotate: -5 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="fixed bottom-12 left-12 sticky-note sticky-blue w-48 p-4 z-50"
      >
        <p className="handwritten text-sm mb-2">Did you know?</p>
        <p className="handwritten text-base">{facts[currentFactIndex]}</p>
      </motion.div>
    </div>
  );
}
