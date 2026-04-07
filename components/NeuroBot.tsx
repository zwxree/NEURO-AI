import React from 'react';
import { motion } from 'motion/react';

export default function NeuroBot({ mood = 'happy' }: { mood?: 'happy' | 'thinking' | 'explaining' }) {
  return (
    <div className="w-32 h-32 relative">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Antennas */}
        <motion.path 
          d="M 50 20 L 50 5" 
          stroke="#334155" 
          strokeWidth="3" 
          strokeLinecap="round"
          animate={mood === 'thinking' ? { rotate: [0, 15, -15, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ transformOrigin: '50px 20px' }}
        />
        <circle cx="50" cy="5" r="4" fill="#f59e0b" />
        
        {/* Head */}
        <rect x="20" y="20" width="60" height="50" rx="15" fill="#e2e8f0" stroke="#334155" strokeWidth="3" />
        
        {/* Screen/Face */}
        <rect x="28" y="30" width="44" height="30" rx="5" fill="#0f172a" />
        
        {/* Eyes based on mood */}
        {mood === 'happy' && (
          <>
            <path d="M 35 45 Q 40 35 45 45" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 55 45 Q 60 35 65 45" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
        {mood === 'thinking' && (
          <>
            <circle cx="40" cy="45" r="3" fill="#38bdf8" />
            <circle cx="60" cy="45" r="3" fill="#38bdf8" />
            <path d="M 35 38 L 45 40" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <path d="M 55 40 L 65 38" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {mood === 'explaining' && (
          <>
            <circle cx="40" cy="42" r="4" fill="#38bdf8" />
            <path d="M 60 42 L 65 42" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <path d="M 45 52 Q 50 58 55 52" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Body */}
        <path d="M 35 70 L 65 70 L 75 95 L 25 95 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="3" strokeLinejoin="round" />
        
        {/* Arms */}
        <motion.path 
          d="M 25 75 Q 10 80 15 90" 
          fill="none" 
          stroke="#334155" 
          strokeWidth="4" 
          strokeLinecap="round" 
          animate={mood === 'explaining' ? { rotate: [0, -20, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ transformOrigin: '25px 75px' }}
        />
        <motion.path 
          d="M 75 75 Q 90 80 85 90" 
          fill="none" 
          stroke="#334155" 
          strokeWidth="4" 
          strokeLinecap="round"
          animate={mood === 'explaining' ? { rotate: [0, 20, 0] } : {}}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
          style={{ transformOrigin: '75px 75px' }}
        />
      </svg>
    </div>
  );
}
