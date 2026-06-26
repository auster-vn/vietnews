import React from 'react';
import { Article } from '@/components/Banner';
import MainFeed from '@/components/MainFeed';

export const revalidate = 300; // Cache and revalidate every 5 minutes

async function getArticles(): Promise<Article[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/api/articles?limit=50`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

async function getBannerArticles(): Promise<Article[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${apiUrl}/api/banner`, {
      next: { revalidate: 300 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching banner articles:', error);
    return [];
  }
}

export default async function Home() {
  const [allArticles, bannerArticles] = await Promise.all([
    getArticles(),
    getBannerArticles()
  ]);

  // Fallback: If bannerArticles is empty, we can use the top 5 articles from allArticles
  const resolvedBannerArticles = bannerArticles.length > 0 
    ? bannerArticles 
    : allArticles.slice(0, 5);

  return (
    <main className="h-[100dvh] sm:min-h-screen bg-slate-950 text-white font-sans selection:bg-rose-500 selection:text-white overflow-hidden sm:overflow-visible relative">
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1600px] h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent pointer-events-none z-0" />

      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 relative z-10 flex flex-col h-full sm:min-h-screen justify-between overflow-hidden sm:overflow-visible">
        
        {/* Main Feed Container (Client Side updates) */}
        <MainFeed initialArticles={allArticles} initialBannerArticles={resolvedBannerArticles} />

        {/* Footer */}
        <footer className="hidden sm:flex border-t border-white/5 pt-8 mt-16 text-center flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-medium w-full">
          <p>© 2026 VietNews. Thiết kế bất đối xứng premium.</p>
          <div className="flex items-center gap-4">
            <a href="https://vietnamplus.vn" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              Nguồn tin: VietnamPlus
            </a>
            <span>•</span>
            <span>Không quảng cáo</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
