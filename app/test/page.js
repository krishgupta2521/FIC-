"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';

export default function TestPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">
      {/* --- BACKGROUND EFFECT --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        
        {/* Tag */}
        <div 
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm 
            text-gray-400 text-sm font-medium mb-8 transition-all duration-1000 transform
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          `}
        >
          <TrendingUp size={14} className="text-white" />
          <span>Live Trading Simulation (TEST PAGE)</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-2 mb-6">
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-500">
            FIC Hansraj
          </h1>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-white">
            Stock Exchange
          </h1>
        </div>

        <div className="mt-10 p-4 border border-red-500 rounded text-red-400">
          If you can see this, the New Design works! <br/>
          The problem is your Home Page logic (Auth/Redirects).
        </div>
      </main>
    </div>
  );
}