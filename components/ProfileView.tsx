"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { User, LogOut, Award, BookOpen, Map as MapIcon, Activity } from 'lucide-react';
import { auth, db, signInWithGoogle, logOut } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProfileView() {
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfileData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile data:", error);
      setLoading(false);
    });

    return () => unsubscribeDoc();
  }, [user]);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("Sign-in popup closed by user.");
      } else {
        setAuthError(error.message || "Failed to sign in.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16 max-w-md mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-white/40" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-white">Join The STEM Project</h2>
        <p className="text-white/60 leading-relaxed">
          Sign in to save your learning progress, track your quiz scores, and build your personalized exploration history.
        </p>
        {authError && (
          <div className="text-red-400 text-sm font-medium bg-red-500/20 border border-red-500/30 px-4 py-3 rounded-xl w-full">
            {authError}
          </div>
        )}
        <button 
          onClick={handleSignIn}
          className="glass-button px-8 py-4 w-full flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="glass-panel p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden relative">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName} fill className="object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-10 h-10 text-white/40" strokeWidth={1.5} />
            )}
          </div>
          <div className="pt-2">
            <h2 className="text-2xl font-bold text-white mb-1">{user.displayName || 'STEM Explorer'}</h2>
            <p className="text-white/50 text-sm mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                {profileData?.completedModules?.length || 0} Modules
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                {Object.keys(profileData?.quizScores || {}).length} Quizzes
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={logOut}
          className="glass-button px-4 py-2 text-sm font-semibold text-red-400 border-red-500/30 hover:bg-red-500/20 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quiz Scores */}
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-white/60" />
            <h3 className="font-bold text-sm tracking-widest text-white/80">QUIZ SCORES</h3>
          </div>
          
          {(!profileData?.quizScores || Object.keys(profileData.quizScores).length === 0) ? (
            <p className="text-white/40 text-sm italic">No quizzes completed yet. Take a quiz to see your scores here!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(profileData.quizScores).map(([topic, score]: [string, any]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="font-semibold text-white/70">{topic}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-white/90 w-10 text-right">{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Modules */}
        <div className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-6 h-6 text-white/60" />
            <h3 className="font-bold text-sm tracking-widest text-white/80">COMPLETED MODULES</h3>
          </div>
          
          {(!profileData?.completedModules || profileData.completedModules.length === 0) ? (
            <p className="text-white/40 text-sm italic">No modules completed yet. Start learning to track your progress!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {profileData.completedModules.map((module: string, i: number) => (
                <span key={i} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-semibold text-white/70">
                  {module}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Exploration History */}
        <div className="md:col-span-2 glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-white/60" />
            <h3 className="font-bold text-sm tracking-widest text-white/80">EXPLORATION HISTORY</h3>
          </div>
          
          {(!profileData?.explorationHistory || profileData.explorationHistory.length === 0) ? (
            <p className="text-white/40 text-sm italic">Your exploration history will appear here as you navigate the app.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...profileData.explorationHistory].reverse().slice(0, 5).map((action: string, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-white/20"></div>
                  <span className="text-white/70 font-medium">{action}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
