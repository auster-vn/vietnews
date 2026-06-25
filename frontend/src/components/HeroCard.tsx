"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import NewsMeta from './NewsMeta';
import ActionButtons from './ActionButtons';

export interface Article {
  id: string;
  source_url: string;
  title: string;
  summary: string;
  category: string;
  thumbnail_url?: string;
  rendered_image_url?: string;
  image_width?: number;
  image_height?: number;
  hot_score: number;
  is_rendered: boolean;
  published_at: string;
  updated_at?: string;
}

interface HeroCardProps {
  article: Article;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCopyImage?: () => void;
  formatViews: (score: number) => string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'chinh-tri': 'CHÍNH TRỊ',
  'kinh-te': 'KINH TẾ',
  'the-gioi': 'THẾ GIỚI',
  'xa-hoi': 'XÃ HỘI',
  'the-thao': 'THỂ THAO',
  'khoa-hoc': 'KHOA HỌC',
  'van-hoa': 'VĂN HÓA',
  'other': 'TIN TỨC'
};

export default function HeroCard({
  article,
  onSwipeLeft,
  onSwipeRight,
  formatViews
}: HeroCardProps) {
  const thumbnail = article.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600';
  const label = CATEGORY_LABELS[article.category] || CATEGORY_LABELS['other'];
  
  // Format published time
  let timeStr = 'Vừa xong';
  if (article.published_at) {
    try {
      const date = new Date(article.published_at);
      timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      timeStr = article.published_at;
    }
  }

  // Dynamic aspect ratio calculation
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (article.image_width && article.image_height) {
      setAspectRatio(article.image_width / article.image_height);
      return;
    }
    const img = new Image();
    img.src = thumbnail;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
  }, [thumbnail, article.image_width, article.image_height]);

  // Framer Motion drag animation controls
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.7, 1, 1, 1, 0.7]);
  const scale = useTransform(x, [-150, 0, 150], [0.96, 1, 0.96]);
  const controls = useAnimation();

  const handleDragEnd = async (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      await controls.start({ x: -400, opacity: 0, transition: { duration: 0.2 } });
      onSwipeLeft();
      x.set(0);
      controls.set({ x: 0, opacity: 1 });
    } else if (info.offset.x > swipeThreshold) {
      await controls.start({ x: 400, opacity: 0, transition: { duration: 0.2 } });
      onSwipeRight();
      x.set(0);
      controls.set({ x: 0, opacity: 1 });
    } else {
      controls.start({ x: 0, opacity: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  // Determine if portrait (ratio < 0.85)
  const isPortrait = aspectRatio ? aspectRatio < 0.85 : false;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate, opacity, scale }}
      className={`w-full h-full flex flex-col select-none touch-pan-y cursor-grab active:cursor-grabbing mx-auto bg-transparent relative scrollbar-none ${
        isPortrait ? 'justify-start overflow-y-auto' : 'justify-center overflow-hidden'
      }`}
    >
      {/* 1. Image Container: shrink-0 (retains original aspect height), scrollable flow */}
      <div className="shrink-0 relative w-full overflow-hidden flex items-center justify-center bg-transparent rounded-[28px]">
        {/* Ambient Blur Backdrop replica of the image */}
        <img
          src={thumbnail}
          className="absolute inset-0 w-full h-full object-cover filter blur-[36px] scale-110 opacity-[0.25] pointer-events-none z-0 select-none"
          alt=""
          draggable={false}
        />
        {/* Subtle dark tint over the blur background */}
        <div className="absolute inset-0 bg-[#0E0E10]/40 pointer-events-none z-5" />

        {/* Foreground sharp uncropped image with original aspect width/height */}
        <div className="relative w-full flex items-center justify-center z-10">
          <img
            src={thumbnail}
            className="w-full h-auto object-contain rounded-[28px] border border-white/5 pointer-events-none select-none block"
            alt=""
            draggable={false}
          />

          {/* Floating Badges overlaying on the top corners of the image bounds */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-[#FF2D55] shadow-lg shadow-[#FF2D55]/20 self-start">
                🔥 Trending
              </span>
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md border border-white/10 shadow-md self-start">
                {label}
              </span>
            </div>
            <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md border border-white/10 shadow-md">
              VietnamPlus
            </span>
          </div>
        </div>
      </div>

      {/* 2. Transition Gradient spacer block (for portrait fade) */}
      {isPortrait && (
        <div className="h-4 bg-gradient-to-b from-transparent to-[#0E0E10] shrink-0" />
      )}

      {/* 3. Content Container (flex-shrink-0, stacked below image in flow, scrolls along if portrait tall) */}
      <div className="shrink-0 flex flex-col gap-2 mt-2 px-1 w-full relative z-20 pb-8">
        <div className="w-full flex flex-col">
          <NewsMeta
            title={article.title}
            summary={article.summary}
            timeStr={timeStr}
            viewsStr={formatViews(article.hot_score)}
            hotScore={article.hot_score}
            isPortrait={isPortrait}
          />
          <ActionButtons sourceUrl={article.source_url} />
        </div>
      </div>
    </motion.div>
  );
}
