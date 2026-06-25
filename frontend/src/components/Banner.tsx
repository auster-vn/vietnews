'use client';

import React from 'react';

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

interface BannerProps {
  articles: Article[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'chinh-tri': 'bg-rose-600 text-white',
  'kinh-te': 'bg-emerald-600 text-white',
  'the-gioi': 'bg-blue-600 text-white',
  'xa-hoi': 'bg-amber-600 text-white',
  'the-thao': 'bg-pink-600 text-white',
  'khoa-hoc': 'bg-violet-600 text-white',
  'van-hoa': 'bg-fuchsia-600 text-white',
  'other': 'bg-gray-600 text-white'
};

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

export default function Banner({ articles }: BannerProps) {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const sideArticles = articles.slice(1, 5);

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const getPill = (cat: string) => {
    const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
    const label = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
      {/* Featured Article - 60% width (3 of 5 grid columns) */}
      <div className="lg:col-span-3 flex flex-col h-auto lg:h-[500px] min-h-[450px] lg:min-h-0 relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/40 backdrop-blur-md group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/10">
        <a href={featured.source_url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col md:flex-row z-20">
          
          {/* Left Column / Bottom Row (Text Content) */}
          <div className="flex flex-col justify-between p-6 md:p-8 w-full md:w-[55%] h-auto md:h-full order-2 md:order-1 relative z-20">
            <div className="flex items-center gap-3">
              {getPill(featured.category)}
              <span className="text-xs text-gray-400 font-semibold tracking-wide">
                {formatTime(featured.published_at)}
              </span>
              <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                🔥 {featured.hot_score}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white line-clamp-3 leading-tight tracking-tight group-hover:text-rose-400 transition-colors my-2">
              {featured.title}
            </h1>
            
            <p className="text-xs md:text-sm text-gray-300 line-clamp-3 leading-relaxed font-medium">
              {featured.summary}
            </p>
          </div>

          {/* Right Column / Top Row (Image Container with blurred background) */}
          <div className="w-full md:w-[45%] h-[200px] md:h-full order-1 md:order-2 relative overflow-hidden bg-black/20 flex items-center justify-center p-4">
            {/* Blurred background */}
            {featured.thumbnail_url && (
              <img
                src={featured.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md pointer-events-none"
              />
            )}
            {/* Main Image with object-contain to preserve original aspect ratio */}
            {featured.thumbnail_url && (
              <img
                src={featured.thumbnail_url}
                alt={featured.title}
                className="max-w-full max-h-full object-contain rounded-lg border border-white/5 shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-[1.02]"
              />
            )}
          </div>
          
        </a>
        {/* Card Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 z-30" />
      </div>

      {/* Side Articles Grid - 40% width (2 of 5 grid columns) */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto lg:h-[500px]">
        {sideArticles.map((article, idx) => (
          <div 
            key={article.id || idx}
            className="flex flex-col relative rounded-xl overflow-hidden border border-white/10 bg-gray-900/92 backdrop-blur-md group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/5 min-h-[120px]"
          >
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="flex flex-col h-full justify-end p-4 z-20">
              {/* Background thumbnail image with low opacity */}
              {article.thumbnail_url && (
                <img
                  src={article.thumbnail_url}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-30"
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10" />

              {/* Text content */}
              <div className="relative z-20 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getPill(article.category)}
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                    🔥 {article.hot_score}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-white line-clamp-3 leading-snug tracking-tight group-hover:text-amber-400 transition-colors">
                  {article.title}
                </h3>

                <span className="text-[10px] text-gray-500 font-semibold mt-1">
                  {formatTime(article.published_at)}
                </span>
              </div>
            </a>
          </div>
        ))}
        
        {/* Placeholder if less than 4 side articles */}
        {sideArticles.length < 4 && Array.from({ length: 4 - sideArticles.length }).map((_, idx) => (
          <div 
            key={`placeholder-${idx}`}
            className="flex items-center justify-center rounded-xl border border-white/5 bg-gray-950/40 p-4 text-xs text-gray-600 font-semibold uppercase tracking-wider"
          >
            Tin tức cập nhật...
          </div>
        ))}
      </div>
    </div>
  );
}
