"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface ActionButtonsProps {
  sourceUrl: string;
}

export default function ActionButtons({
  sourceUrl
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center w-full mt-2 pointer-events-auto">
      {/* Primary: Read Original (Full Width) */}
      <motion.a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.96 }}
        className="w-full h-[56px] rounded-full bg-white hover:bg-white/95 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 select-none cursor-pointer transition-colors duration-200"
      >
        <ExternalLink className="w-4 h-4 text-black" />
        <span>Đọc bài gốc</span>
      </motion.a>
    </div>
  );
}
