"use client";

import React, { useState } from 'react';
import { Article } from './Banner';

export default function CrawlForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successArticle, setSuccessArticle] = useState<Article | null>(null);
  const successIsPortrait = successArticle?.image_height && successArticle?.image_width
    ? successArticle.image_height > successArticle.image_width
    : false;

  const validateUrl = (inputUrl: string) => {
    const trimmed = inputUrl.trim();
    return (
      trimmed.startsWith('https://www.vietnamplus.vn') ||
      trimmed.startsWith('http://www.vietnamplus.vn') ||
      trimmed.startsWith('https://vietnamplus.vn') ||
      trimmed.startsWith('http://vietnamplus.vn')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessArticle(null);

    if (!url.trim()) {
      setError('Vui lòng nhập URL bài viết.');
      return;
    }

    if (!validateUrl(url)) {
      setError('Chỉ hỗ trợ link bài viết từ VietnamPlus (vietnamplus.vn).');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/articles/crawl-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Lấy tin thất bại. Vui lòng thử lại sau.');
      }

      const data: Article = await res.json();
      setSuccessArticle(data);
      setUrl('');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi kết nối tới máy chủ.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 lg:my-8">
      {/* Container Card with Premium Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/15">
        
        {/* Decorative corner lights */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 flex items-center gap-2">
            <span>Tự Cào Tin Nóng</span>
            <span className="text-xs font-semibold py-0.5 px-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider animate-pulse">Crawl On Demand</span>
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Dán link bài viết từ VietnamPlus vào đây để lấy tin tức mới nhất, phân tích độ nóng và thiết kế card đồ họa ngay lập tức.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-grow relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Nhập URL bài viết từ VietnamPlus (ví dụ: https://www.vietnamplus.vn/chinh-tri/...)"
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all duration-200 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-rose-950/30"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xem ngay</span>
              )}
            </button>
          </form>

          {/* Status logs inside crawl loop */}
          {loading && (
            <div className="mt-4 p-4 rounded-xl border border-white/5 bg-slate-950/40 flex flex-col gap-2 animate-pulse">
              <div className="flex items-center gap-3 text-xs text-rose-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Đang lấy tin và thiết kế ảnh...</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Quy trình: Tải trang HTML → Phân tích selectolax → Tính toán điểm nóng hot_score → Chạy Satori render PNG → Tải lên Cloudinary CDN.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Preview of successfully rendered article */}
          {successArticle && (
            <div className="mt-8 border-t border-white/5 pt-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Crawl & Thiết kế thành công!
                </h3>
                <button 
                  onClick={() => setSuccessArticle(null)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Xóa xem trước
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Visual density: Pill badges, dark overlay, hover effect */}
                <div className={`relative group rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 mx-auto w-full ${
                  successIsPortrait ? 'aspect-[630/1200] max-w-[300px]' : 'aspect-[1200/630]'
                }`}>
                  <a href={successArticle.source_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    {successArticle.rendered_image_url ? (
                      <img 
                        src={`${successArticle.rendered_image_url}?t=${successArticle.updated_at || ''}`} 
                        alt="Bản tin đồ họa preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-gray-600 text-xs">
                        Không có ảnh đồ họa
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-all duration-300" />
                  </a>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {successArticle.category?.toUpperCase() || 'TIN NÓNG'}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                      🔥 {successArticle.hot_score}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 leading-snug line-clamp-2">
                    {successArticle.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                    {successArticle.summary}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={successArticle.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all duration-200 hover:scale-[1.02]"
                    >
                      Đọc bài gốc
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {successArticle.rendered_image_url && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(successArticle.rendered_image_url || '');
                          alert('Đã sao chép link ảnh vào clipboard!');
                        }}
                        className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-all duration-200 hover:scale-[1.02]"
                      >
                        Sao chép link ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
