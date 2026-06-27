"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  X,
  Play,
  Pause
} from 'lucide-react';
import CrawlForm from './CrawlForm';
import Header from './Header';
import CategoryTabs from './CategoryTabs';
import HeroCard, { Article } from './HeroCard';

interface MainFeedProps {
  initialArticles: Article[];
  initialBannerArticles: Article[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  'chinh-tri': { bg: 'bg-rose-600/20 text-rose-400 border-rose-500/30', text: 'text-rose-400', hex: '#FF2D55' },
  'kinh-te': { bg: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', text: 'text-emerald-400', hex: '#059669' },
  'the-gioi': { bg: 'bg-blue-600/20 text-blue-400 border-blue-500/30', text: 'text-blue-400', hex: '#2563EB' },
  'xa-hoi': { bg: 'bg-amber-600/20 text-amber-400 border-amber-500/30', text: 'text-amber-400', hex: '#D97706' },
  'the-thao': { bg: 'bg-pink-600/20 text-pink-400 border-pink-500/30', text: 'text-pink-400', hex: '#DB2777' },
  'khoa-hoc': { bg: 'bg-violet-600/20 text-violet-400 border-violet-500/30', text: 'text-violet-400', hex: '#7C3AED' },
  'van-hoa': { bg: 'bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-500/30', text: 'text-fuchsia-400', hex: '#C026D3' },
  'other': { bg: 'bg-gray-600/20 text-gray-400 border-gray-500/30', text: 'text-gray-400', hex: '#4B5563' }
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

function formatViews(score: number): string {
  const views = Math.floor(score * 35);
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

function LiveCardPreview({ article, onImageClick }: { article: Article; onImageClick?: (url: string) => void }) {
  const cat = article.category || 'other';
  const label = CATEGORY_LABELS[cat] || CATEGORY_LABELS['other'];
  
  let dateStr = 'Mới cập nhật';
  let timeOnly = 'Mới';
  if (article.published_at) {
    try {
      const date = new Date(article.published_at);
      dateStr = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' (GMT+7)';
      timeOnly = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      dateStr = article.published_at;
    }
  }

  const thumbnail = article.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600';
  
  const config = CATEGORY_COLORS[cat] || CATEGORY_COLORS['other'];

  // We can determine if the article's image is portrait
  const isPortrait = article.image_height && article.image_width
    ? article.image_height > article.image_width
    : false;

  if (isPortrait) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#0F1115] flex flex-row p-6 select-none text-white font-sans">
        {/* Blurred BG */}
        <img
          src={thumbnail}
          className="absolute -top-10 -left-10 w-[110%] h-[120%] object-cover opacity-[0.18] blur-[30px] pointer-events-none z-0"
          alt=""
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1115]/98 via-[#0F1115]/95 to-[#141821]/90 z-0" />
        {/* Accent border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: config.hex }} />
        
        {/* Left Column (Text) - 1/3 width (33%) */}
        <div className="relative z-10 flex flex-col w-[33%] h-full justify-between pr-2">
          {/* Header section */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider text-white" style={{ backgroundColor: config.hex }}>
                {label}
              </span>
            </div>
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider">
              VIETNEWS
            </span>
          </div>

          {/* Title */}
          <h2 className="font-serif text-sm sm:text-base font-black text-white leading-snug tracking-tight line-clamp-6 my-2">
            {article.title}
          </h2>

          {/* Footer Metadata */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-2 mt-auto">
            <div className="flex flex-col">
              <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest">PUBLISHED AT</span>
              <span className="text-[10px] text-gray-400 font-medium">{dateStr}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest">HOT SCORE</span>
              <span className="text-xs font-black text-amber-500 flex items-center gap-0.5 animate-pulse">
                🔥 {article.hot_score}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (Image) - 2/3 width (67%) */}
        <div 
          className="relative z-10 w-[67%] h-full flex items-center justify-center cursor-zoom-in"
          onClick={() => onImageClick?.(thumbnail)}
        >
          <img
            src={thumbnail}
            className="max-w-full max-h-[92%] object-contain rounded-lg border border-white/10 shadow-2xl transition-transform hover:scale-[1.02]"
            alt="Cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0F1115] flex flex-row p-6 md:p-8 select-none text-white font-sans">
      {/* Blurred BG */}
      <img
        src={thumbnail}
        className="absolute -top-10 -left-10 w-[110%] h-[120%] object-cover opacity-[0.18] blur-[30px] pointer-events-none z-0"
        alt=""
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F1115]/98 via-[#0F1115]/95 to-[#141821]/90 z-0" />
      {/* Accent border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ backgroundColor: config.hex }} />
      
      {/* Left Column (Text) */}
      <div className="relative z-10 flex flex-col w-[52%] h-full justify-between">
        {/* Header section */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider text-white" style={{ backgroundColor: config.hex }}>
            {label}
          </span>
          <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">
            VIETNEWS
          </span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight line-clamp-4 my-4">
          {article.title}
        </h2>

        {/* Footer Metadata */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">PUBLISHED AT</span>
            <span className="text-xs text-gray-400 mt-1 font-medium">{dateStr}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">HOT SCORE</span>
            <span className="text-sm sm:text-base font-black text-amber-500 mt-1 flex items-center gap-0.5 animate-pulse">
              🔥 {article.hot_score}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column (Image) */}
      <div 
        className="relative z-10 w-[44%] h-full self-center flex items-center justify-center ml-auto cursor-zoom-in"
        onClick={() => onImageClick?.(thumbnail)}
      >
        <img
          src={thumbnail}
          className="max-w-full max-h-[85%] object-contain rounded-lg border border-white/10 shadow-2xl transition-transform hover:scale-[1.02]"
          alt="Cover"
        />
      </div>
    </div>
  );
}

export default function MainFeed({ initialArticles, initialBannerArticles }: MainFeedProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [bannerArticles, setBannerArticles] = useState<Article[]>(initialBannerArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Dashboard & Navigation states
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoplay, setAutoplay] = useState(false);
  const [isCrawlExpanded, setIsCrawlExpanded] = useState(false);

  // Zoomed Image preview overlay state
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/articles?limit=50`);
        if (res.ok) {
          const freshArticles: Article[] = await res.json();
          if (freshArticles && freshArticles.length > 0) {
            setArticles(freshArticles);
            
            // Silently check if the banner articles have changed
            const resBanner = await fetch(`${apiUrl}/api/banner`);
            if (resBanner.ok) {
              const freshBanner: Article[] = await resBanner.json();
              setBannerArticles(freshBanner.length > 0 ? freshBanner : freshArticles.slice(0, 5));
            }
          }
        }
      } catch (err) {
        console.warn('Background check for fresh articles failed:', err);
      }
    };
    
    // Check silently after a 1 second delay to prioritize initial page interaction
    const timer = setTimeout(fetchLatest, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Compute Stats for Dashboard
  const totalCrawled = articles.length;
  const hotCount = articles.filter(a => a.hot_score >= 60).length;
  const maxHotScore = articles.reduce((max, a) => a.hot_score > max ? a.hot_score : max, 0);
  const politicsCount = articles.filter(a => a.category === 'chinh-tri').length;
  const economicsCount = articles.filter(a => a.category === 'kinh-te').length;

  // Filter headlines (memoized, sorted by hot_score DESC)
  const filteredArticles = useMemo(() => {
    const list = articles.filter(art => {
      const matchesCategory = !selectedCategory || art.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
    return [...list].sort((a, b) => {
      if (b.hot_score !== a.hot_score) {
        return b.hot_score - a.hot_score;
      }
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });
  }, [articles, selectedCategory, searchQuery]);

  const activeArticle = filteredArticles.find(a => a.id === selectedArticleId) || filteredArticles[0];

  // Sync active selection when filter yields items
  useEffect(() => {
    if (filteredArticles.length > 0 && !filteredArticles.some(a => a.id === selectedArticleId)) {
      setSelectedArticleId(filteredArticles[0].id);
    }
  }, [filteredArticles, selectedArticleId]);

  // Use a Ref to hold the latest filteredArticles for the autoplay loop
  const filteredArticlesRef = useRef(filteredArticles);
  useEffect(() => {
    filteredArticlesRef.current = filteredArticles;
  }, [filteredArticles]);

  // Autoplay loop
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      const currentList = filteredArticlesRef.current;
      if (currentList.length <= 1) return;
      
      setSelectedArticleId(currentId => {
        const activeId = currentId || currentList[0]?.id;
        const currentIndex = currentList.findIndex(a => a.id === activeId);
        const nextIndex = (currentIndex + 1) % currentList.length;
        return currentList[nextIndex]?.id || null;
      });
    }, 6000);
    
    return () => clearInterval(interval);
  }, [autoplay]);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/articles/crawl-hot-now`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Đồng bộ tin tức thất bại. Vui lòng thử lại sau.');
      }

      const updatedArticles: Article[] = await res.json();
      setArticles(updatedArticles);

      // Filter hot rendered articles for the banner (re-evaluate banner list)
      const renderedHot = updatedArticles.filter(art => art.is_rendered && art.hot_score >= 60);
      const newBanner = renderedHot.length > 0 
        ? renderedHot.slice(0, 5) 
        : updatedArticles.slice(0, 5);
      setBannerArticles(newBanner);

      if (updatedArticles.length > 0) {
        setSelectedArticleId(updatedArticles[0].id);
      }

      setSuccessMsg('Đã cập nhật bản tin nóng đồ họa mới nhất thành công!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi cập nhật tin mới.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };


  const handleSwipeLeft = () => {
    if (filteredArticles.length <= 1) return;
    const currentIdx = filteredArticles.findIndex(a => a.id === activeArticle.id);
    if (currentIdx !== -1) {
      const nextIdx = (currentIdx + 1) % filteredArticles.length;
      setSelectedArticleId(filteredArticles[nextIdx].id);
      setAutoplay(false);
    }
  };

  const handleSwipeRight = () => {
    if (filteredArticles.length <= 1) return;
    const currentIdx = filteredArticles.findIndex(a => a.id === activeArticle.id);
    if (currentIdx !== -1) {
      const prevIdx = (currentIdx - 1 + filteredArticles.length) % filteredArticles.length;
      setSelectedArticleId(filteredArticles[prevIdx].id);
      setAutoplay(false);
    }
  };

  const handleCopyImage = () => {
    const thumbnail = activeArticle?.thumbnail_url || '';
    const imgUrl = activeArticle?.rendered_image_url || thumbnail;
    navigator.clipboard.writeText(imgUrl);
    alert('Đã sao chép link ảnh vào clipboard!');
  };

  const getPill = (cat: string) => {
    const config = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
    const label = CATEGORY_LABELS[cat] || CATEGORY_LABELS.other;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${config.bg}`}>
        {label}
      </span>
    );
  };

  // Render Mobile Viewport (either full screen on mobile devices or nested inside phone shell on desktop)
  const renderMobileViewport = () => {
    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#0E0E10] text-white">
        {/* Floating Header with Category Selection */}
        <Header 
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setAutoplay(false);
          }}
          isMobileView={true}
        />

        {/* Content Area - Lock heights and clear floating header */}
        <div className="flex-grow flex flex-col pt-[68px] pb-4 h-full justify-between overflow-hidden">
          
          {/* Swipe Card viewport - occupies 85-90% of screen spacing */}
          <div className="flex-grow flex items-center justify-center relative px-3 my-2 min-h-0 overflow-hidden">
            {activeArticle ? (
              <div className="relative w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
                
                {/* Left chevron button trigger */}
                <button
                  onClick={handleSwipeRight}
                  className="absolute left-1 z-35 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-black/60 transition-all shadow-lg active:scale-95 cursor-pointer"
                  title="Bài trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Adaptive Hero Graphic Viewer with drag swipe gestures */}
                <div className="w-full h-full flex items-center justify-center relative z-10 p-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeArticle.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <HeroCard
                        article={activeArticle}
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                        onCopyImage={handleCopyImage}
                        formatViews={formatViews}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right chevron button trigger */}
                <button
                  onClick={handleSwipeLeft}
                  className="absolute right-1 z-35 w-9 h-9 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-black/60 transition-all shadow-lg active:scale-90 cursor-pointer"
                  title="Bài tiếp"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-[#B8B8B8] text-sm py-16">Chưa có bài viết nào</div>
            )}
          </div>

        </div>
      </div>
    );
  };

  // FULL SCREEN MOBILE VIEWPORT ON PHONE DEVICES
  if (isMobile) {
    return (
      <div className="h-[100dvh] w-full bg-[#0E0E10] text-white overflow-hidden relative select-none">
        {renderMobileViewport()}
      </div>
    );
  }

  // ORIGINAL DESKTOP VIEWPORT
  const activeIsPortrait = activeArticle?.image_height && activeArticle?.image_width
    ? activeArticle.image_height > activeArticle.image_width
    : false;

  return (
    <div className="w-full flex flex-col min-h-[500px]">
      {/* Navigation Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2">
            VIET<span className="text-rose-500">NEWS</span>
            <span className="text-[10px] font-extrabold py-0.5 px-2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-widest">Dash</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mt-1.5">
            Bản tin hot tự động • Giám sát thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Crawl on demand toggler */}
          <button
            onClick={() => setIsCrawlExpanded(!isCrawlExpanded)}
            className={`py-1.5 px-3 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all duration-200 flex-grow sm:flex-grow-0 text-center ${isCrawlExpanded ? 'border-rose-500 text-rose-400 bg-rose-950/20' : 'border-white/5 text-gray-400 hover:text-white bg-slate-900/40'}`}
          >
            {isCrawlExpanded ? 'Đóng cào tin' : 'Tự cào tin 📤'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-white/10 hover:border-rose-500/30 bg-slate-900/60 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex-grow sm:flex-grow-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-rose-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đồng bộ...</span>
              </>
            ) : (
              <>
                <span className="text-rose-500">Cập nhật tin mới</span>
              </>
            )}
          </button>

        </div>
      </header>

      {/* Slide-out Crawl Form */}
      {isCrawlExpanded && (
        <div className="mb-6 animate-slideDown">
          <CrawlForm />
        </div>
      )}

      {/* Sync Status Overlay */}
      {loading && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-slate-900/40 backdrop-blur-md flex flex-col gap-1.5 animate-pulse">
          <div className="flex items-center gap-2 text-xs text-rose-400 font-bold">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Đang đồng bộ tin tức nóng...</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Hệ thống đang quét qua trang chủ VietnamPlus → Lọc qua Redis → Phân tích và chấm điểm hot_score → Thiết kế layout bằng Satori và xuất ảnh đồ họa → Cập nhật dashboard.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Overview Bar */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase">Tin đã cào</span>
          <span className="text-2xl font-black text-white mt-1">{totalCrawled}</span>
        </div>
        <div className="p-4 rounded-xl border border-rose-500/10 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] text-rose-500 font-extrabold tracking-widest uppercase">Tin nóng 🔥</span>
          <span className="text-2xl font-black text-rose-400 mt-1">{hotCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase">Chính trị ⚖️</span>
          <span className="text-2xl font-black text-white mt-1">{politicsCount}</span>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] text-gray-500 font-extrabold tracking-widest uppercase">Kinh tế 📊</span>
          <span className="text-2xl font-black text-white mt-1">{economicsCount}</span>
        </div>
        <div className="col-span-2 md:col-span-1 p-4 rounded-xl border border-amber-500/10 bg-slate-900/30 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[10px] text-amber-500 font-extrabold tracking-widest uppercase">Điểm nóng nhất</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{maxHotScore}</span>
        </div>
      </div>

      {/* Main Split-Screen Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-grow">
        
        {/* Left Column: Headline Scanner (5 columns) */}
        <div className="lg:col-span-5 flex flex-col h-[580px] rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-lg overflow-hidden p-4">
          {/* Controls: Category list & search */}
          <div className="flex flex-col gap-3 mb-4 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm kiếm tin nhanh..."
              className="w-full h-9 px-3 rounded-lg bg-slate-950/80 border border-white/5 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-rose-500/30"
            />
            
            {/* Category pills list */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/5 select-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`py-1 px-2.5 rounded text-[10px] font-black tracking-wider uppercase border transition-all ${!selectedCategory ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-950/60 text-gray-400 border-transparent hover:text-white'}`}
              >
                Tất cả
              </button>
              {Object.keys(CATEGORY_LABELS).map(catKey => (
                <button
                  key={catKey}
                  onClick={() => {
                    setSelectedCategory(catKey === 'other' ? null : catKey);
                    setAutoplay(false);
                  }}
                  className={`py-1 px-2.5 rounded text-[10px] font-black tracking-wider uppercase border transition-all shrink-0 ${selectedCategory === catKey ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-950/60 text-gray-400 border-transparent hover:text-white'}`}
                >
                  {CATEGORY_LABELS[catKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Headline Scroll Stack */}
          <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin scrollbar-thumb-white/5">
            {filteredArticles.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs py-8">
                Không tìm thấy bài viết nào
              </div>
            ) : (
              filteredArticles.map((article) => {
                const isActive = activeArticle?.id === article.id;
                const isHot = article.hot_score >= 60;
                
                // Format published time
                let timeStr = 'Mới';
                if (article.published_at) {
                  try {
                    const date = new Date(article.published_at);
                    timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    timeStr = article.published_at;
                  }
                }

                return (
                  <div
                    key={article.id}
                    onClick={() => {
                      setSelectedArticleId(article.id);
                      setAutoplay(false); // Stop autoplay when user manually interacts
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${isActive ? 'bg-slate-900/80 border-rose-500/40 shadow-lg shadow-rose-950/5' : 'bg-slate-950/40 border-white/5 hover:bg-slate-900/30 hover:border-white/10'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                            CATEGORY_COLORS[article.category]?.bg || CATEGORY_COLORS.other.bg
                          }`}>
                            {CATEGORY_LABELS[article.category] || CATEGORY_LABELS.other}
                          </span>
                          <span className="text-[9px] text-gray-500 font-semibold">{timeStr}</span>
                        </div>
                        <h3 className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${isActive ? 'text-rose-400' : 'text-gray-300 hover:text-white'}`}>
                          {article.title}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold shrink-0 flex items-center gap-0.5 ${isHot ? 'text-amber-500' : 'text-gray-400'}`}>
                        🔥 {article.hot_score}
                      </span>
                    </div>
                    
                    {/* Hotness gauge */}
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                        style={{ width: `${article.hot_score}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Graphic Canvas Preview (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Autoplay Toolbar */}
          <div className="flex items-center justify-between shrink-0 bg-slate-900/20 border border-white/5 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`flex items-center gap-1.5 font-bold uppercase text-[10px] py-1 px-2.5 rounded transition-all ${autoplay ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black' : 'bg-slate-950/60 text-gray-400 border border-transparent hover:text-white'}`}
              >
                <span>{autoplay ? '⏸️ Tạm dừng' : '▶️ Tự động phát'}</span>
              </button>
              {autoplay && (
                <span className="text-[10px] text-gray-500 animate-pulse">Chuyển tin sau 6 giây...</span>
              )}
            </div>
          </div>

          {/* Canvas Viewport */}
          <div 
            className={`relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl select-none group mx-auto transition-all duration-300 ${
              activeIsPortrait 
                ? 'aspect-[1/1] w-full' 
                : 'aspect-[1200/630] w-full'
            }`}
          >
            {activeArticle ? (
              /* High-fidelity Vector React replica */
              <div className="absolute inset-0 w-full h-full animate-fadeIn">
                <LiveCardPreview 
                  article={activeArticle} 
                  onImageClick={(url) => setZoomedImageUrl(url)}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">Vui lòng chọn bài viết</div>
            )}
          </div>

          {/* Action Toolbar under the preview */}
          {activeArticle && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-slate-900/10 shrink-0">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">Tóm tắt bài viết</span>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 font-medium">
                  {activeArticle.summary}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2.5 border-t border-white/5 pt-3 mt-1">
                <a
                  href={activeArticle.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all duration-200 hover:scale-[1.02] flex-grow sm:flex-grow-0"
                >
                  Đọc bài gốc 🔗
                </a>
                
                {activeArticle.rendered_image_url && (
                  <>
                    <button
                      onClick={handleCopyImage}
                      className="inline-flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 text-[10px] sm:text-xs font-semibold border border-rose-500/20 transition-all duration-200 hover:scale-[1.02] flex-grow sm:flex-grow-0"
                    >
                      Sao chép link ảnh 📋
                    </button>

                    <a
                      href={activeArticle.rendered_image_url}
                      download={`vietnews-${activeArticle.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 text-[10px] sm:text-xs font-semibold transition-all duration-200 hover:scale-[1.02] flex-grow sm:flex-grow-0"
                    >
                      Tải ảnh 📥
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* High-Resolution Zoomed Image Lightbox Modal Overlay */}
      {zoomedImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            {/* Close Button */}
            <button 
              className="absolute top-2 right-2 md:top-4 md:right-4 z-55 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 border border-white/15 transition-all active:scale-95 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImageUrl(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <img 
              src={zoomedImageUrl} 
              alt="Zoomed preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10 cursor-default select-none animate-fadeIn"
              onClick={(e) => e.stopPropagation()} // Prevent modal closure when clicking image itself
            />
          </div>
        </div>
      )}

    </div>
  );
}
