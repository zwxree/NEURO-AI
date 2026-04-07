"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronDown, ArrowRight, ArrowLeft, Sparkles, BookOpen, User, Mic, Video, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { auth, logOut, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import InteractiveBrain from '../components/InteractiveBrain';
import LiveTutor from '../components/LiveTutor';
import NeuroBot from '../components/NeuroBot';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const syllabusContent = [
  {
    title: "Computer Systems and Organisation",
    class: "Class 11",
    content: "Basic computer hardware, CPU, memory units (bit to PB), software types (system, application, utilities), operating systems, Boolean logic (gates, De Morgan's laws), number systems (binary, octal, hex), and encoding schemes (ASCII, Unicode)."
  },
  {
    title: "Computational Thinking and Programming – 1",
    class: "Class 11",
    content: "Problem-solving steps (algorithms, flowcharts), Python basics (tokens, variables, data types), flow of control (if-else, for/while loops), and complex data types (Strings, Lists, Tuples, Dictionaries)."
  },
  {
    title: "Society, Law, and Ethics",
    class: "Class 11",
    content: "Digital footprints, cyber safety, netiquette, data protection (IPR, plagiarism), cybercrime (hacking, phishing), E-waste management, and the IT Act."
  },
  {
    title: "Computational Thinking and Programming – 2",
    class: "Class 12",
    content: "Revision of Class 11 concepts, Functions (types, scope, parameters), Exception Handling (try-except-finally), File Handling (Text, Binary, and CSV files), and Data Structures (Stacks using lists)."
  },
  {
    title: "Computer Networks",
    class: "Class 12",
    content: "Evolution of networking (ARPANET, Internet), data communication terminologies (bandwidth, IP address), transmission media (wired/wireless), network devices (routers, switches), topologies (star, bus, tree), and protocols (HTTP, TCP/IP, FTP)."
  },
  {
    title: "Database Management",
    class: "Class 12",
    content: "Database concepts, Relational Data Model (keys, attributes), Structured Query Language (SQL - DDL/DML commands, joins, aggregate functions), and Python-SQL connectivity."
  },
  {
    title: "Practical Components",
    class: "Both Classes",
    content: "• Python Programming: Lab tests and report file programs.\n• SQL Queries: Practical execution of database commands (Class 12 only).\n• Project Work: Real-world application development using Python and/or SQL.\n• Viva Voce: Oral examination based on the syllabus and project."
  }
];

export default function NeuroLearningBook() {
  const [activeTab, setActiveTab] = useState('Index');
  const [pageIndex, setPageIndex] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({'learning-note': true});
  const [dynamicNote, setDynamicNote] = useState("Loading insights...");
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ displayName: user.displayName, email: user.email });
          }
        });
        return () => unsubDoc();
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const indexItems = syllabusContent.map((item, i) => ({
    title: `${i + 1}. ${item.title}`,
    subtitle: `(${item.class})`
  }));

  const filteredIndex = indexItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tabs = [
    { id: 'Index', label: 'Index' },
    { id: 'Class 11', label: 'Class 11' },
    { id: 'Class 12', label: 'Class 12' },
    { id: 'Practicals', label: 'Practicals' },
    { id: 'Live Tutor', label: 'Live Tutor' },
    { id: 'Profile', label: 'Profile' }
  ];

  useEffect(() => {
    if (activeTab === 'Index') setPageIndex(0);
    else if (activeTab === 'Class 11') setPageIndex(1);
    else if (activeTab === 'Class 12') setPageIndex(3);
    else if (activeTab === 'Practicals') setPageIndex(4);
    else if (activeTab === 'Live Tutor') setPageIndex(5);
    else if (activeTab === 'Profile') setPageIndex(6);
  }, [activeTab]);

  useEffect(() => {
    // Only fetch dynamic note for syllabus pages
    if (pageIndex < 1 || pageIndex > 4) return;

    const fetchDynamicNote = async () => {
      setDynamicNote("Fetching evidence-based insights from the web...");
      try {
        const leftTopicIndex = (pageIndex - 1) * 2;
        const rightTopicIndex = leftTopicIndex + 1;
        const topic1 = syllabusContent[leftTopicIndex];
        const topic2 = syllabusContent[rightTopicIndex];
        
        let currentTopic = topic1 ? topic1.title : "Computer Science";
        if (topic2) currentTopic += " and " + topic2.title;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Search the web for a fascinating fact or study tip about: ${currentTopic}. 
          CRITICAL INSTRUCTION: Use evidence-based methods to refine the content for a neurodivergent learner (e.g., ADHD, Autism, Dyslexia). 
          - Keep it under 3 sentences. 
          - Use clear, literal language. 
          - Avoid idioms and sarcasm. 
          - Use bullet points if helpful. 
          - Format as plain text or simple markdown.`,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });
        setDynamicNote(response.text || "Keep exploring!");
      } catch (err) {
        console.error(err);
        setDynamicNote("Ready to learn! (Offline mode)");
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchDynamicNote();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [pageIndex]);

  const renderPageContent = () => {
    if (pageIndex === 0) {
      return {
        left: (
          <div className="book-page book-page-left flex-1">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold italic">Syllabus Index</h1>
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
                  <div key={i} className="flex justify-between items-end border-b border-slate-300 pb-1 relative group cursor-pointer hover:text-blue-600" onClick={() => {
                    const targetPage = Math.floor(i/2) + 1;
                    setPageIndex(targetPage);
                    if (targetPage === 1 || targetPage === 2) setActiveTab('Class 11');
                    else if (targetPage === 3) setActiveTab('Class 12');
                    else if (targetPage === 4) setActiveTab('Practicals');
                  }}>
                    <div className="flex items-center gap-2">
                      {i < 3 && <Sparkles className="w-4 h-4 text-amber-500 absolute -left-6" />}
                      <span>{item.title}</span>
                    </div>
                    <span className="text-sm italic">{item.subtitle}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">No topics found...</p>
              )}
            </div>
            <div className="absolute bottom-8 left-12 text-xs font-bold text-slate-400">Page 1</div>
          </div>
        ),
        right: (
          <div className="book-page book-page-right flex-1 flex flex-col justify-center items-center text-center">
            <BookOpen className="w-24 h-24 text-slate-300 mb-6" />
            <h2 className="text-3xl font-bold italic mb-4">Computer Science</h2>
            <p className="handwritten text-lg text-slate-600 max-w-md">
              A comprehensive guide to Class 11 and Class 12 Computer Science, covering systems, programming, networks, and databases.
            </p>
            <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>Page 2</span>
              <button onClick={() => { setPageIndex(1); setActiveTab('Class 11'); }} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                Next Page <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )
      };
    }

    if (pageIndex >= 1 && pageIndex <= 4) {
      const leftTopicIndex = (pageIndex - 1) * 2;
      const rightTopicIndex = leftTopicIndex + 1;
      const leftTopic = syllabusContent[leftTopicIndex];
      const rightTopic = syllabusContent[rightTopicIndex];

      return {
        left: (
          <div className="book-page book-page-left flex-1 relative">
            {leftTopic && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h1 className="text-2xl font-bold italic">{leftTopic.title}</h1>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{leftTopic.class}</span>
                </div>
                <div className="space-y-4 handwritten text-lg leading-relaxed whitespace-pre-wrap">
                  {leftTopic.content}
                </div>
              </>
            )}
            <div className="absolute bottom-8 left-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <button onClick={() => setPageIndex(pageIndex - 1)} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Prev Page
              </button>
              <span>Page {pageIndex * 2 + 1}</span>
            </div>
          </div>
        ),
        right: (
          <div className="book-page book-page-right flex-1 relative">
            {rightTopic && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h1 className="text-2xl font-bold italic">{rightTopic.title}</h1>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{rightTopic.class}</span>
                </div>
                <div className="space-y-4 handwritten text-lg leading-relaxed whitespace-pre-wrap">
                  {rightTopic.content}
                </div>
              </>
            )}
            
            <motion.div 
              drag
              dragConstraints={bookRef}
              initial={{ scale: 0, rotate: -5, opacity: 0 }}
              animate={{ 
                scale: 1, 
                rotate: 2, 
                opacity: 1,
                height: expandedNotes['learning-note'] ? 'auto' : '60px'
              }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => toggleNote('learning-note')}
              className="sticky-note sticky-yellow absolute top-1/2 right-4 w-72 p-4 cursor-pointer overflow-hidden shadow-lg z-10"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="handwritten text-sm font-bold">Dynamic Insight</p>
                {expandedNotes['learning-note'] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
              <AnimatePresence>
                {expandedNotes['learning-note'] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2"
                  >
                    <div className="handwritten text-sm leading-relaxed whitespace-pre-wrap">
                      {dynamicNote}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>Page {pageIndex * 2 + 2}</span>
              {pageIndex < 6 && (
                <button onClick={() => {
                  const next = pageIndex + 1;
                  setPageIndex(next);
                  if (next === 5) setActiveTab('Live Tutor');
                }} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                  Next Page <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )
      };
    }

    if (pageIndex === 5) {
      return {
        left: (
          <div className="book-page book-page-left flex-1">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold italic mb-6">Live Voice Tutor</h2>
              <NeuroBot mood={'explaining'} />
            </div>
            <div className="w-full h-[60%]">
              <LiveTutor />
            </div>
            <div className="mt-8 border-2 border-slate-800 p-4 bg-white/50 relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold uppercase italic">How it works</h3>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="handwritten text-xs leading-relaxed">
                Start the voice tutor and ask a question about the syllabus! The AI will watch your expressions. If you look confused, it will automatically simplify the explanation. If you look away, it will remind you to focus!
              </p>
            </div>
            <div className="absolute bottom-8 left-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <button onClick={() => { setPageIndex(4); setActiveTab('Practicals'); }} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Prev Page
              </button>
              <span>Page 11</span>
            </div>
          </div>
        ),
        right: (
          <div className="book-page book-page-right flex-1">
            <h2 className="text-2xl font-bold italic mb-6 uppercase tracking-widest text-center">3D Cortical Atlas</h2>
            <div className="relative w-full h-[60%] mb-8 flex justify-center items-center">
              <InteractiveBrain />
            </div>
            <div className="mt-8 text-center">
              <p className="handwritten text-sm text-slate-600">
                Explore the brain regions responsible for learning and memory while you study.
              </p>
            </div>
            <div className="absolute bottom-8 right-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>Page 12</span>
              <button onClick={() => { setPageIndex(6); setActiveTab('Profile'); }} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                Next Page <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )
      };
    }

    if (pageIndex === 6) {
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
                <h3 className="text-xl font-bold italic mb-2">Not Signed In</h3>
                <p className="text-sm text-slate-500 mb-6">Sign in to track your learning progress and save your notes.</p>
                <button className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors">
                  Sign In
                </button>
              </div>
            )}
            <div className="absolute bottom-8 left-12 flex items-center gap-2 text-xs font-bold text-slate-400">
              <button onClick={() => { setPageIndex(5); setActiveTab('Live Tutor'); }} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Prev Page
              </button>
              <span>Page 13</span>
            </div>
          </div>
        ),
        right: (
          <div className="book-page book-page-right flex-1">
            <h2 className="text-2xl font-bold italic mb-8">Learning Progress</h2>
            <div className="space-y-8 mt-12">
              <div className="space-y-2">
                <span className="handwritten font-bold">Class 11 Topics: {userId ? '45%' : '0%'}</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: userId ? '45%' : '0%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <span className="handwritten font-bold">Class 12 Topics: {userId ? '10%' : '0%'}</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: userId ? '10%' : '0%' }} />
                </div>
              </div>
              <div className="space-y-2">
                <span className="handwritten font-bold">Practicals: {userId ? '25%' : '0%'}</span>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: userId ? '25%' : '0%' }} />
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 right-12 text-xs font-bold text-slate-400">Page 14</div>
          </div>
        )
      };
    }

    return { left: <div />, right: <div /> };
  };

  const { left, right } = renderPageContent();

  return (
    <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center p-8 font-sans overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-6xl h-[85vh] flex relative z-10">
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-2 mr-4 mt-12 z-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-l-xl font-bold text-sm transition-all origin-right ${
                activeTab === tab.id 
                  ? 'bg-[#f8f9fa] text-slate-800 shadow-[-4px_4px_10px_rgba(0,0,0,0.1)] scale-105 z-10' 
                  : 'bg-slate-300 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* The Book */}
        <div ref={bookRef} className="flex-1 bg-[#f8f9fa] rounded-r-2xl rounded-l-sm shadow-2xl flex relative perspective-1000">
          {/* Book Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-300 to-transparent z-20 pointer-events-none" />
          <div className="absolute left-1/2 top-0 bottom-0 w-16 -ml-8 bg-gradient-to-r from-transparent via-slate-200 to-transparent z-20 pointer-events-none shadow-inner" />
          
          {/* Left Page */}
          {left}

          {/* Right Page */}
          {right}
        </div>
      </div>
    </div>
  );
}
