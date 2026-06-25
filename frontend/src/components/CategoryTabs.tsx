"use client";

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CategoryTabsProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
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

export default function CategoryTabs({
  selectedCategory,
  onSelectCategory
}: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active chip into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeChild = container.querySelector('[data-active="true"]') as HTMLElement;
    if (activeChild) {
      const containerWidth = container.clientWidth;
      const childOffset = activeChild.offsetLeft;
      const childWidth = activeChild.clientWidth;
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: childOffset - containerWidth / 2 + childWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory]);

  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-2 overflow-x-auto py-2.5 px-4 scrollbar-none select-none shrink-0 w-full bg-transparent relative z-30 pointer-events-auto"
    >
      {CATEGORY_ITEMS.map((item) => {
        const isActive = selectedCategory === item.key;
        return (
          <button
            key={item.key ?? 'all'}
            onClick={() => onSelectCategory(item.key)}
            data-active={isActive}
            className={`relative h-9 px-5 rounded-full text-xs font-bold tracking-wide uppercase transition-colors duration-300 shrink-0 select-none cursor-pointer flex items-center justify-center`}
          >
            {/* Sliding background highlight for active element */}
            {isActive && (
              <motion.div
                layoutId="activeCategoryBg"
                className="absolute inset-0 bg-[#FF2D55] rounded-full shadow-[0_4px_12px_rgba(255,45,85,0.3)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? 'text-white' : 'text-[#B8B8B8] hover:text-white'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
