import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Banner, { Article } from '../Banner';
import NewsFeed from '../NewsFeed';
import CrawlForm from '../CrawlForm';
import MainFeed from '../MainFeed';

const mockArticles: Article[] = [
  {
    id: '1',
    source_url: 'https://vietnamplus.vn/art1',
    title: 'Featured Hot Article Title',
    summary: 'This is the summary of the featured hot article.',
    category: 'chinh-tri',
    thumbnail_url: 'https://img.vietnamplus.vn/art1.jpg',
    rendered_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/vietnews/art1.png',
    hot_score: 95,
    is_rendered: true,
    published_at: '2026-06-24T00:00:00+07:00'
  },
  {
    id: '2',
    source_url: 'https://vietnamplus.vn/art2',
    title: 'Second Article Title',
    summary: 'Summary 2.',
    category: 'kinh-te',
    thumbnail_url: 'https://img.vietnamplus.vn/art2.jpg',
    rendered_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/vietnews/art2.png',
    hot_score: 80,
    is_rendered: true,
    published_at: '2026-06-24T00:05:00+07:00'
  }
];

describe('Frontend Components Tests', () => {
  it('should render Banner component with featured and side articles', () => {
    render(<Banner articles={mockArticles} />);
    
    // Assert featured article is rendered
    expect(screen.getByText('Featured Hot Article Title')).toBeDefined();
    expect(screen.getByText('This is the summary of the featured hot article.')).toBeDefined();
    expect(screen.getByText('CHÍNH TRỊ')).toBeDefined();
    
    // Assert side articles is rendered
    expect(screen.getByText('Second Article Title')).toBeDefined();
    expect(screen.getByText('KINH TẾ')).toBeDefined();
  });

  it('should render NewsFeed component grid of rendered images', () => {
    render(<NewsFeed articles={mockArticles} />);
    
    // Check main section header
    expect(screen.getByText('Bản tin đồ họa')).toBeDefined();
    
    // Check that anchor wrapper link points to source url
    const firstArticleCard = document.getElementById(`article-card-${mockArticles[0].id}`);
    expect(firstArticleCard).toBeDefined();
    expect(firstArticleCard?.getAttribute('href')).toBe(mockArticles[0].source_url);
    
    // Check that image src points to cloudinary
    const imgElement = firstArticleCard?.querySelector('img');
    expect(imgElement).toBeDefined();
    expect(imgElement?.getAttribute('src')).toContain(mockArticles[0].rendered_image_url);
  });

  it('should render CrawlForm with input and button', () => {
    render(<CrawlForm />);
    expect(screen.getByPlaceholderText(/Nhập URL bài viết từ VietnamPlus/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xem ngay/i })).toBeDefined();
  });

  it('should show error when submitting invalid URL', async () => {
    render(<CrawlForm />);
    const input = screen.getByPlaceholderText(/Nhập URL bài viết từ VietnamPlus/i);
    const button = screen.getByRole('button', { name: /Xem ngay/i });

    fireEvent.change(input, { target: { value: 'https://invalid-domain.com/article' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Chỉ hỗ trợ link bài viết từ VietnamPlus/i)).toBeDefined();
    });
  });

  it('should call fetch and show crawled article image on success', async () => {
    const mockArticle = {
      id: 'mock-id-123',
      title: 'Bài viết crawl thành công',
      summary: 'Tóm tắt bài viết crawl.',
      category: 'xa-hoi',
      source_url: 'https://vietnamplus.vn/crawled-art',
      rendered_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/vietnews/crawled.png',
      is_rendered: true,
      hot_score: 85,
      published_at: '2026-06-24T00:00:00+07:00'
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockArticle
    });
    global.fetch = mockFetch;

    render(<CrawlForm />);
    const input = screen.getByPlaceholderText(/Nhập URL bài viết từ VietnamPlus/i);
    const button = screen.getByRole('button', { name: /Xem ngay/i });

    fireEvent.change(input, { target: { value: 'https://www.vietnamplus.vn/xa-hoi/crawled-art.vnp' } });
    fireEvent.click(button);

    // Should show loading status first
    expect(screen.getByText(/Đang lấy tin và thiết kế ảnh.../i)).toBeDefined();

    // Wait for success and check that preview is rendered
    await waitFor(() => {
      expect(screen.getByText('Bài viết crawl thành công')).toBeDefined();
      const img = screen.getByAltText('Bản tin đồ họa preview');
      expect(img.getAttribute('src')).toContain(mockArticle.rendered_image_url);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/articles/crawl-now'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({ url: 'https://www.vietnamplus.vn/xa-hoi/crawled-art.vnp' })
      })
    );
  });

  it('should render MainFeed with initial articles and refresh button', () => {
    render(<MainFeed initialArticles={mockArticles} initialBannerArticles={mockArticles} />);
    expect(screen.getByText('Cập nhật tin mới')).toBeDefined();
    expect(screen.getAllByText('Featured Hot Article Title')[0]).toBeDefined();
  });

  it('should trigger crawl-hot-now fetch call and update articles on success', async () => {
    const mockUpdatedArticles = [
      {
        id: 'new-1',
        source_url: 'https://vietnamplus.vn/art-new',
        title: 'New Hot Crawled Article',
        summary: 'New summary.',
        category: 'kinh-te',
        thumbnail_url: 'https://img.vietnamplus.vn/art-new.jpg',
        rendered_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/vietnews/new.png',
        hot_score: 99,
        is_rendered: true,
        published_at: '2026-06-24T00:10:00+07:00'
      },
      ...mockArticles
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockUpdatedArticles
    });
    global.fetch = mockFetch;

    render(<MainFeed initialArticles={mockArticles} initialBannerArticles={mockArticles} />);
    const refreshButton = screen.getByText('Cập nhật tin mới');

    fireEvent.click(refreshButton);

    // Should show loading overlay/status
    expect(screen.getByText(/Đang đồng bộ tin tức nóng.../i)).toBeDefined();

    // Wait for success and verify feed has the new article title
    await waitFor(() => {
      expect(screen.getAllByText('New Hot Crawled Article')[0]).toBeDefined();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/articles/crawl-hot-now'),
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
