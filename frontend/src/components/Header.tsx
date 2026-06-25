"use client";

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  isMobileView?: boolean;
}

const CATEGORY_ITEMS = [
  { key: null, label: 'Tất cả' },
  { key: 'the-gioi', label: 'Thế giới' },
  { key: 'xa-hoi', label: 'Việt Nam' },
  { key: 'kinh-te', label: 'Kinh tế' },
  { key: 'khoa-hoc', label: 'Công nghệ' },
  { key: 'the-thao', label: 'Thể thao' },
  { key: 'van-hoa', label: 'Giải trí' }
];

export default function Header({ 
  selectedCategory = null, 
  onSelectCategory,
  isMobileView = true
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeItem = CATEGORY_ITEMS.find(item => item.key === selectedCategory) || CATEGORY_ITEMS[0];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 px-4 pt-5 pb-3 bg-gradient-to-b from-[#0E0E10]/95 via-[#0E0E10]/80 to-transparent backdrop-blur-[2px] pointer-events-auto select-none">
      <div className="flex items-center justify-between">
        {/* Left logo section */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter text-white">
            VIET<span className="text-[#FF2D55]">NEWS</span>
          </h1>
          <p className="text-[9px] text-[#B8B8B8] font-extrabold uppercase tracking-[0.2em] mt-0.5">
            SWIPE ĐỂ ĐỌC {selectedCategory !== null ? `• ${activeItem.label.toUpperCase()}` : ''}
          </p>
        </div>

        {/* Right hamburger menu trigger - only if callbacks are provided */}
        {onSelectCategory && isMobileView && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Toggle Category Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Dropdown Menu Overlay */}
      {isOpen && onSelectCategory && isMobileView && (
        <div className="absolute top-[72px] right-4 left-4 bg-[#16161A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-3 py-1.5 mb-1 border-b border-white/5">
            Chủ đề tin tức
          </div>
          {CATEGORY_ITEMS.map((item) => {
            const isActive = selectedCategory === item.key;
            return (
              <button
                key={item.key ?? 'all'}
                onClick={() => {
                  onSelectCategory(item.key);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/20'
                    : 'text-[#B8B8B8] hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
