import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function MemoryDiagram() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border-2 border-slate-200 shadow-inner overflow-hidden">
      <h3 className="text-lg font-bold italic mb-4 text-slate-700">Memory Allocation & Pointers</h3>
      
      <div className="flex gap-8 items-center w-full max-w-md">
        {/* Variables */}
        <div className="flex flex-col gap-4">
          <div className="text-sm font-bold text-slate-500 uppercase text-center">Variables</div>
          
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-600">int x</span>
            <div className="w-16 h-10 border-2 border-blue-400 bg-blue-100 rounded flex items-center justify-center font-mono font-bold">
              42
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-purple-600">int* p</span>
            <div className="w-16 h-10 border-2 border-purple-400 bg-purple-100 rounded flex items-center justify-center font-mono text-xs">
              {step >= 1 ? '0x1A4' : 'null'}
            </div>
          </div>
        </div>

        {/* Pointer Arrow */}
        <div className="flex-1 h-32 relative">
          {step >= 1 && (
            <motion.svg 
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" />
                </marker>
              </defs>
              <path 
                d="M 10 100 C 50 100, 50 20, 90 20" 
                fill="transparent" 
                stroke="#9333ea" 
                strokeWidth="3" 
                strokeDasharray={step === 2 ? "5,5" : "none"}
                markerEnd="url(#arrowhead)" 
              />
            </motion.svg>
          )}
        </div>

        {/* RAM / Memory */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-bold text-slate-500 uppercase text-center">RAM (Memory)</div>
          <div className="border-2 border-slate-800 rounded-lg overflow-hidden bg-white shadow-md">
            {[
              { addr: '0x1A0', val: '0' },
              { addr: '0x1A4', val: step >= 3 ? '99' : '42', highlight: true },
              { addr: '0x1A8', val: '10' },
              { addr: '0x1AC', val: '0' },
            ].map((cell, i) => (
              <div key={i} className={`flex border-b border-slate-200 last:border-0 ${cell.highlight && step >= 1 ? 'bg-amber-100' : ''}`}>
                <div className="px-2 py-1 bg-slate-100 border-r border-slate-200 font-mono text-xs text-slate-500 w-16 text-center">
                  {cell.addr}
                </div>
                <div className="px-4 py-1 font-mono font-bold text-slate-800 w-16 text-center">
                  {cell.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 h-16 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="handwritten text-slate-600"
          >
            {step === 0 && "1. A variable 'x' is created in memory, holding the value 42."}
            {step === 1 && "2. A pointer 'p' is created and assigned the memory address of 'x' (&x)."}
            {step === 2 && "3. The pointer 'p' now 'points' to the location 0x1A4 in RAM."}
            {step === 3 && "4. Dereferencing the pointer (*p = 99) changes the value at that address!"}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
