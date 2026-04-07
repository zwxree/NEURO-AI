"use client";

import React, { useState } from 'react';
import { Map as MapIcon, ZoomIn, ZoomOut, Maximize, Layers, ArrowLeft, Search, Filter } from 'lucide-react';

export default function MapView({ onBack }: { onBack: () => void }) {
  const [zoom, setZoom] = useState(100);
  const [activeLayer, setActiveLayer] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const nodes = [
    { id: 1, label: 'Quantum Mechanics', x: 20, y: 30, size: 'lg', color: 'bg-purple-500/40' },
    { id: 2, label: 'Thermodynamics', x: 70, y: 20, size: 'md', color: 'bg-pink-500/40' },
    { id: 3, label: 'Calculus', x: 40, y: 60, size: 'xl', color: 'bg-blue-500/40' },
    { id: 4, label: 'Genetics', x: 80, y: 70, size: 'lg', color: 'bg-emerald-500/40' },
    { id: 5, label: 'Algorithms', x: 30, y: 80, size: 'md', color: 'bg-indigo-500/40' },
    { id: 6, label: 'Robotics', x: 60, y: 50, size: 'lg', color: 'bg-slate-500/40' },
  ];

  return (
    <div className="flex flex-col gap-8 w-full h-full min-h-[80vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Concept Atlas</h2>
          <p className="text-white/60">Explore the interconnected map of STEM concepts.</p>
        </div>
        <button onClick={onBack} className="px-6 py-3 glass-button">
          Back to Home
        </button>
      </div>

      <div className="flex-1 glass-panel relative overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex flex-col gap-2">
              <button onClick={() => setZoom(z => Math.min(z + 25, 200))} className="p-3 glass-button" title="Zoom In">
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setZoom(z => Math.max(z - 25, 50))} className="p-3 glass-button" title="Zoom Out">
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => setZoom(100)} className="p-3 glass-button" title="Reset Zoom">
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex flex-col gap-2 relative">
              <button 
                onClick={() => setActiveLayer(activeLayer === 'all' ? 'core' : 'all')} 
                className={`p-3 rounded-xl transition-colors ${activeLayer === 'core' ? 'bg-white/30 text-white' : 'glass-button text-white/70'}`}
                title="Toggle Layers"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`p-3 rounded-xl transition-colors ${showFilters ? 'bg-white/30 text-white' : 'glass-button text-white/70'}`}
                title="Filters"
              >
                <Filter className="w-5 h-5" />
              </button>
              
              {showFilters && (
                <div className="absolute top-0 left-16 w-48 glass-panel p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-left-2">
                  <h4 className="text-xs font-bold tracking-widest text-white/50 mb-2">FILTER BY</h4>
                  {['Physics', 'Math', 'Biology', 'CS'].map(f => (
                    <label key={f} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input type="checkbox" className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50" defaultChecked />
                      {f}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-input px-4 py-3 flex items-center gap-3 pointer-events-auto w-64">
            <Search className="w-5 h-5 text-white/50" />
            <input 
              type="text" 
              placeholder="Search concepts..." 
              className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/40 w-full"
            />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative w-full h-full min-h-[500px] overflow-hidden bg-black/20 rounded-b-3xl flex items-center justify-center">
          <div 
            className="relative w-full h-full transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Nodes */}
            {nodes.map((node) => (
              <div 
                key={node.id}
                className={`absolute rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg backdrop-blur-md border border-white/30 ${node.color}`}
                style={{ 
                  left: `${node.x}%`, 
                  top: `${node.y}%`,
                  width: node.size === 'xl' ? '120px' : node.size === 'lg' ? '90px' : '60px',
                  height: node.size === 'xl' ? '120px' : node.size === 'lg' ? '90px' : '60px',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <span className="text-white font-bold text-xs text-center px-2 drop-shadow-sm">
                  {node.label}
                </span>
              </div>
            ))}

            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="20%" y1="30%" x2="40%" y2="60%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="40%" y1="60%" x2="70%" y2="20%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="40%" y1="60%" x2="30%" y2="80%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="70%" y1="20%" x2="80%" y2="70%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="40%" y1="60%" x2="60%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
