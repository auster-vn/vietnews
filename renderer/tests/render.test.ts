import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePng } from '../src/satori_render';
import { uploadBuffer, processUnrenderedArticles, renderSingleArticle } from '../src/cloudinary_uploader';

// Set mock environment variables for testing
process.env.NEON_DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.CLOUDINARY_CLOUD_NAME = 'mock';
process.env.CLOUDINARY_API_KEY = 'mock';
process.env.CLOUDINARY_API_SECRET = 'mock';

// Mock Cloudinary
vi.mock('cloudinary', () => {
  return {
    v2: {
      uploader: {
        upload_stream: vi.fn((options, callback) => {
          const mockResult = { secure_url: 'https://cdn.cloudinary.com/vietnews/img.png' };
          const mockStream = {
            write: vi.fn(),
            end: vi.fn(() => {
              callback(null, mockResult);
            })
          };
          return mockStream;
        })
      },
      config: vi.fn()
    }
  };
});

// Mock pg Client
const mockQuery = vi.fn();
const mockConnect = vi.fn();
const mockEnd = vi.fn();
vi.mock('pg', () => {
  return {
    Client: vi.fn().mockImplementation(() => {
      return {
        connect: mockConnect,
        query: mockQuery,
        end: mockEnd
      };
    })
  };
});

describe('Image Renderer Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a valid PNG buffer from article details', async () => {
    const article = {
      title: 'Bản tin chính trị nóng',
      summary: 'Tóm tắt bài viết.',
      category: 'chinh-tri',
      hot_score: 85,
      published_at: '2026-06-24T00:00:00+07:00'
    };

    const { buffer } = await generatePng(article);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a valid PNG buffer when thumbnail is a WebP image', async () => {
    const article = {
      title: 'Bản tin khoa học công nghệ',
      summary: 'Tóm tắt bài viết về khoa học công nghệ.',
      category: 'khoa-hoc',
      thumbnail_url: 'https://www.gstatic.com/webp/gallery/1.webp',
      hot_score: 95,
      published_at: '2026-06-24T00:00:00+07:00'
    };

    const { buffer } = await generatePng(article);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should upload a buffer to Cloudinary and return the url', async () => {
    const buffer = Buffer.from('fake-png-data');
    const url = await uploadBuffer(buffer);
    expect(url).toBe('https://cdn.cloudinary.com/vietnews/img.png');
  });

  it('should process unrendered articles from PostgreSQL', async () => {
    // Setup mock query responses
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Tin nóng chính trị',
          summary: 'Nội dung tóm tắt.',
          category: 'chinh-tri',
          thumbnail_url: 'https://example.com/thumb.jpg',
          hot_score: 90,
          published_at: new Date('2026-06-24T00:00:00+07:00')
        }
      ]
    });
    mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // For update statement

    const processedCount = await processUnrenderedArticles(5);
    expect(processedCount).toBe(1);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockEnd).toHaveBeenCalledTimes(1);

    // Verify first query was select
    const selectSql = mockQuery.mock.calls[0][0];
    expect(selectSql).toContain('WHERE is_rendered = FALSE');

    // Verify second query was update
    const updateSql = mockQuery.mock.calls[1][0];
    const updateParams = mockQuery.mock.calls[1][1];
    expect(updateSql).toContain('UPDATE articles');
    expect(updateSql).toContain('rendered_image_url');
    expect(updateParams[0]).toBe('https://cdn.cloudinary.com/vietnews/img.png');
    expect(updateParams[1]).toBe(1200);
    expect(updateParams[2]).toBe(630);
    expect(updateParams[3]).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should render a single article by ID', async () => {
    // Setup mock query response for fetching the article by ID
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          title: 'Single article title',
          summary: 'Single article summary',
          category: 'the-gioi',
          thumbnail_url: 'https://example.com/thumb.jpg',
          hot_score: 75,
          published_at: new Date('2026-06-24T00:00:00+07:00')
        }
      ]
    });
    mockQuery.mockResolvedValueOnce({ rowCount: 1 }); // For update statement

    const success = await renderSingleArticle('55555555-5555-5555-5555-555555555555');
    expect(success).toBe(true);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockEnd).toHaveBeenCalledTimes(1);

    // Verify first query fetched by ID
    const selectSql = mockQuery.mock.calls[0][0];
    const selectParams = mockQuery.mock.calls[0][1];
    expect(selectSql).toContain('WHERE id = $1');
    expect(selectParams[0]).toBe('55555555-5555-5555-5555-555555555555');

    // Verify second query updated database
    const updateSql = mockQuery.mock.calls[1][0];
    const updateParams = mockQuery.mock.calls[1][1];
    expect(updateSql).toContain('UPDATE articles');
    expect(updateParams[3]).toBe('55555555-5555-5555-5555-555555555555');
  });

  it('should return false if article by ID is not found', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: []
    });

    const success = await renderSingleArticle('66666666-6666-6666-6666-666666666666');
    expect(success).toBe(false);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should generate a vertical card (630x1200) when the thumbnail is portrait', async () => {
    const article = {
      title: 'Bản tin dọc tỷ lệ điện thoại',
      summary: 'Tóm tắt bài viết dọc.',
      category: 'xa-hoi',
      thumbnail_url: 'https://media.vietnamplus.vn/images/c14f6479e83e315b4cf3a2906cc6a51e3c37f9d55f3f504114a539a2aab2560704e019a05d109d4c134b78b442229e3f16c5cc5921fb4575f6de0799618bca594f9efb0c8972265f49d8f86164867992/ttxvn-chim-ve-ho-guom-1-8679.jpg.webp',
      hot_score: 80,
      published_at: '2026-06-24T00:00:00+07:00'
    };

    const { buffer, width, height } = await generatePng(article);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(width).toBe(630);
    expect(height).toBe(1200);
  });
});
