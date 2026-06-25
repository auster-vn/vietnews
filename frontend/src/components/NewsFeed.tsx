'use client';

import React from 'react';
import { Article } from './Banner';

interface NewsFeedProps {
  articles: Article[];
}

export default function NewsFeed({ articles }: NewsFeedProps) {
  // Only display articles that have a rendered image URL
  const renderedArticles = articles.filter(
    (art) => art.is_rendered && art.rendered_image_url
  );

  if (renderedArticles.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 border border-white/5 bg-gray-900/20 rounded-2xl text-center px-4">
        <span className="text-4xl mb-4">🖼️</span>
        <h3 className="text-lg font-bold text-white mb-2">Đang thiết kế ảnh tin tức</h3>
        <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
          Hệ thống đang tự động chuyển hóa các tin nóng hôm nay thành ảnh đồ họa premium. Vui lòng quay lại sau ít phút!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
        <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
          Bản tin đồ họa
        </h2>
        <span className="bg-rose-500/10 text-rose-500 text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
          Mới nhất
        </span>
      </div>

      {/* Responsive Grid: 1 col on Mobile, 2 on Tablet, 3 on Desktop with Bento Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense gap-6">
        {renderedArticles.map((article) => {
          const cardWidth = article.image_width || 1200;
          const cardHeight = article.image_height || 630;
          const isPortrait = cardHeight > cardWidth;

          return (
            <div
              key={article.id}
              className={`flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-gray-900/40 group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-rose-500/5 cursor-pointer ${
                isPortrait ? 'row-span-2' : ''
              }`}
            >
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full relative overflow-hidden ${
                  isPortrait ? 'aspect-[630/1200]' : 'aspect-[1200/630]'
                }`}
                id={`article-card-${article.id}`}
              >
                {/* Cloudinary PNG Rendered Image */}
                <img
                  src={`${article.rendered_image_url}?t=${article.updated_at || ''}`}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
