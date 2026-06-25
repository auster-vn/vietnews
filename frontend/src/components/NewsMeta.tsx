"use client";

import React from 'react';
import { Clock, Eye } from 'lucide-react';

interface NewsMetaProps {
  title: string;
  summary: string;
  timeStr: string;
  viewsStr: string;
  hotScore: number;
  isPortrait?: boolean;
}

export default function NewsMeta({
  title,
  summary,
  timeStr,
  viewsStr,
  hotScore,
  isPortrait = true
}: NewsMetaProps) {
  // Dynamic font size scaling based on length to prevent clipping and fit long titles
  const getTitleSize = (text: string) => {
    if (text.length > 80) return 'text-[16px] sm:text-[20px]';
    if (text.length > 55) return 'text-[19px] sm:text-[23px]';
    return 'text-[23px] sm:text-[28px]';
  };

  return (
    <div className={`flex flex-col select-none text-left ${isPortrait ? 'gap-2 mb-3' : 'gap-3 mt-4 mb-3'}`}>
      
      {/* Metadata Row & Hot Score */}
      <div className="flex flex-wrap items-center gap-2.5 text-white/50 text-xs font-semibold">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 opacity-60" />
          <span>{timeStr}</span>
        </span>
        <span className="opacity-40">•</span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 opacity-60" />
          <span>{viewsStr}</span>
        </span>
        <span className="opacity-40">•</span>
        
        {/* Visual API Hot Score Badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/30 text-[#FF2D55] text-[10px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(255,45,85,0.2)]">
          🔥 Hot Score {hotScore}/100
        </span>
      </div>

      {/* Headline */}
      <h2 className={`font-black leading-tight tracking-tight text-white uppercase ${getTitleSize(title)}`}>
        {title}
      </h2>
    </div>
  );
}
