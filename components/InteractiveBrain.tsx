import React, { useState } from 'react';
import { motion } from 'motion/react';

interface BrainRegion {
  id: string;
  name: string;
  description: string;
  path: string;
  color: string;
}

const brainRegions: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal Lobe',
    description: 'Responsible for higher cognitive functions like memory, emotions, impulse control, problem-solving, social interaction, and motor function.',
    path: 'M 20 100 Q 20 40 80 20 Q 140 10 160 50 Q 160 100 120 140 Q 80 160 20 100 Z',
    color: '#fca5a5' // red-300
  },
  {
    id: 'parietal',
    name: 'Parietal Lobe',
    description: 'Processes sensory information it receives from the outside world, mainly relating to touch, taste, and temperature.',
    path: 'M 160 50 Q 180 20 240 30 Q 280 50 280 100 Q 260 130 200 130 Q 160 120 160 50 Z',
    color: '#93c5fd' // blue-300
  },
  {
    id: 'occipital',
    name: 'Occipital Lobe',
    description: 'The visual processing area of the brain. It is associated with visuospatial processing, distance and depth perception, color determination, object and face recognition.',
    path: 'M 280 100 Q 320 120 310 180 Q 290 220 240 200 Q 220 160 280 100 Z',
    color: '#fcd34d' // amber-300
  },
  {
    id: 'temporal',
    name: 'Temporal Lobe',
    description: 'Plays an important role in processing affect/emotions, language, and certain aspects of visual perception.',
    path: 'M 120 140 Q 160 120 200 130 Q 220 160 240 200 Q 180 240 120 200 Q 80 180 120 140 Z',
    color: '#86efac' // green-300
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    description: 'Coordinates voluntary movements such as posture, balance, coordination, and speech, resulting in smooth and balanced muscular activity.',
    path: 'M 220 200 Q 260 240 240 280 Q 200 300 160 270 Q 160 220 220 200 Z',
    color: '#d8b4fe' // purple-300
  }
];

export default function InteractiveBrain() {
  const [activeRegion, setActiveRegion] = useState<BrainRegion | null>(null);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="relative w-full aspect-square max-w-md">
        <svg viewBox="0 0 350 350" className="w-full h-full drop-shadow-xl">
          {/* Brain Stem (Static) */}
          <path 
            d="M 140 250 Q 140 320 160 340 L 180 340 Q 180 280 160 250 Z" 
            fill="#e2e8f0" 
            stroke="#94a3b8" 
            strokeWidth="2"
          />
          
          {/* Brain Regions */}
          {brainRegions.map((region) => (
            <motion.path
              key={region.id}
              d={region.path}
              fill={activeRegion?.id === region.id ? region.color : '#f1f5f9'}
              stroke="#64748b"
              strokeWidth="2"
              strokeLinejoin="round"
              whileHover={{ scale: 1.05, filter: 'brightness(0.95)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveRegion(region)}
              className="cursor-pointer transition-colors duration-300"
              style={{ transformOrigin: 'center' }}
            />
          ))}
        </svg>

        {/* Labels for regions when not active */}
        {!activeRegion && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-[15%] handwritten text-xs text-slate-500 rotate-[-15deg]">Frontal</div>
            <div className="absolute top-[20%] right-[25%] handwritten text-xs text-slate-500 rotate-[10deg]">Parietal</div>
            <div className="absolute top-[40%] right-[5%] handwritten text-xs text-slate-500 rotate-[25deg]">Occipital</div>
            <div className="absolute top-[50%] left-[40%] handwritten text-xs text-slate-500">Temporal</div>
            <div className="absolute bottom-[20%] right-[30%] handwritten text-xs text-slate-500">Cerebellum</div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="mt-4 h-32 w-full border-2 border-slate-800 p-4 bg-white/80 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: activeRegion ? activeRegion.color : '#cbd5e1' }} />
        {activeRegion ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={activeRegion.id}
          >
            <h3 className="font-bold italic text-lg mb-1">{activeRegion.name}</h3>
            <p className="handwritten text-sm leading-relaxed">{activeRegion.description}</p>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 handwritten italic">
            Select a brain region to view details...
          </div>
        )}
      </div>
    </div>
  );
}
