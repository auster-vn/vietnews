"use client";

import React from 'react';
import { Radio } from 'lucide-react';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-5 pb-3 bg-gradient-to-b from-[#0E0E10]/80 via-[#0E0E10]/40 to-transparent backdrop-blur-[2px] pointer-events-auto select-none">
      {/* Left logo section */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black tracking-tighter text-white">
          VIET<span className="text-[#FF2D55]">NEWS</span>
        </h1>
        <p className="text-[9px] text-[#B8B8B8] font-extrabold uppercase tracking-[0.2em] mt-0.5">
          SWIPE ĐỂ ĐỌC
        </p>
      </div>
    </header>
  );
}
