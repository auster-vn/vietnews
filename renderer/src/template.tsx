import React from 'react';

export interface ArticleData {
  title: string;
  summary: string;
  category: string;
  thumbnail_url?: string;
  hot_score: number;
  published_at: string;
  image_width?: number;
  image_height?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'chinh-tri': { bg: '#E11D48', text: '#FFFFFF' }, // Rose/Red
  'kinh-te': { bg: '#059669', text: '#FFFFFF' },  // Emerald Green
  'the-gioi': { bg: '#2563EB', text: '#FFFFFF' },  // Royal Blue
  'xa-hoi': { bg: '#D97706', text: '#FFFFFF' },    // Amber/Orange
  'the-thao': { bg: '#DB2777', text: '#FFFFFF' },  // Rose/Pink
  'khoa-hoc': { bg: '#7C3AED', text: '#FFFFFF' },  // Violet/Purple
  'van-hoa': { bg: '#C026D3', text: '#FFFFFF' },   // Fuchsia
  'other': { bg: '#4B5563', text: '#FFFFFF' }      // Slate Gray
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

export function ArticleTemplate(article: ArticleData) {
  const cat = article.category || 'other';
  const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['other'];
  const label = CATEGORY_LABELS[cat] || CATEGORY_LABELS['other'];
  
  // Format published time nicely (e.g. drop seconds or just show date)
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
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      }) + ' (GMT+7)';
      timeOnly = date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh'
      });
    } catch (e) {
      dateStr = article.published_at;
    }
  }

  const thumbnail = article.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600';
  const imgWidth = article.image_width || 1200;
  const imgHeight = article.image_height || 630;
  const isPortrait = imgHeight > imgWidth;

  if (isPortrait) {
    return (
      <div
        style={{
          width: '630px',
          height: '1200px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F1115',
          color: '#FFFFFF',
          fontFamily: 'Inter',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Full-bleed cover image background */}
        <img
          src={thumbnail}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '630px',
            height: '1200px',
            objectFit: 'cover'
          }}
          alt="Full Bleed Cover"
        />

        {/* Dark gradient overlay for text readability */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '700px',
            display: 'flex',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.7) 45%, rgba(0, 0, 0, 0.3) 75%, rgba(0, 0, 0, 0) 100%)'
          }}
        />

        {/* Accent Top Border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: colors.bg
          }}
        />

        {/* Top badges row */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            right: '40px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
            <div
              style={{
                backgroundColor: '#E11D48',
                color: '#FFFFFF',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
                display: 'flex'
              }}
            >
              🔥 ĐANG HOT
            </div>
             <div
              style={{
                backgroundColor: 'rgba(15, 118, 110, 0.4)',
                border: '1px solid rgba(20, 184, 166, 0.2)',
                color: '#2DD4BF',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
                display: 'flex'
              }}
            >
              {label}
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(15, 118, 110, 0.4)',
              border: '1px solid rgba(20, 184, 166, 0.2)',
              color: '#2DD4BF',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '1px',
              display: 'flex'
            }}
          >
            VietnamPlus
          </div>
        </div>

        {/* Bottom Text content overlaid */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '40px',
            right: '40px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          {/* Metadata row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}
          >
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 700 }}>
              🕒 {timeOnly}
            </span>
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 700 }}>•</span>
            <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 700 }}>
              {(() => {
                const views = article.hot_score * 35;
                return views >= 1000 ? `${(views / 1000).toFixed(1)}K đọc` : `${views} đọc`;
              })()}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: 'Lora',
              fontSize: '34px',
              fontWeight: 700,
              lineHeight: 1.3,
              color: '#FFFFFF',
              marginBottom: '15px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {article.title}
          </div>

          {/* Summary */}
          <div
            style={{
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: 1.45,
              color: '#D1D5DB',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {article.summary}
          </div>
        </div>
      </div>
    );
  }

  // Landscape template logic (split screen)
  const renderCoverImage = () => (
    <div
      style={{
        display: 'flex',
        width: '44%',
        height: '420px',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      <img
        src={thumbnail}
        style={(() => {
          const aspectRatio = imgWidth / imgHeight;
          const maxW = 475;
          const maxH = 420;
          const styles: React.CSSProperties = {
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            objectFit: 'contain'
          };
          if (aspectRatio >= maxW / maxH) {
            styles.width = `${maxW}px`;
            styles.height = `${Math.round(maxW / aspectRatio)}px`;
          } else {
            styles.height = `${maxH}px`;
            styles.width = `${Math.round(maxH * aspectRatio)}px`;
          }
          return styles;
        })()}
        alt="Article Cover"
      />
    </div>
  );

  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#0F1115',
        color: '#FFFFFF',
        fontFamily: 'Inter',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Blurred background image */}
      <img
        src={thumbnail}
        style={{
          position: 'absolute',
          top: '-50px',
          left: '-50px',
          width: '1300px',
          height: '730px',
          objectFit: 'cover',
          opacity: 0.18,
          filter: 'blur(30px)'
        }}
        alt="Background Blur"
      />

      {/* Dark editorial overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.96) 0%, rgba(20, 24, 33, 0.88) 100%)'
        }}
      />

      {/* Accent Top Border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
          backgroundColor: colors.bg
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          padding: '60px',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        {/* Left column - Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '52%',
            height: '100%',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Header section */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '1px',
                display: 'flex'
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: 'Lora',
                color: '#6B7280',
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              VIETNEWS
            </div>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '20px', marginBottom: '20px' }}>
            <div
              style={{
                fontFamily: 'Lora',
                fontSize: '44px',
                fontWeight: 700,
                lineHeight: 1.25,
                color: '#FFFFFF',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {article.title}
            </div>
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '20px',
              marginTop: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>PUBLISHED AT</span>
              <span style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px', fontWeight: 500 }}>{dateStr}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}>HOT SCORE</span>
                <span style={{ fontSize: '18px', color: '#F59E0B', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                  🔥 {article.hot_score}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Cover Image */}
        {renderCoverImage()}
      </div>
    </div>
  );
}
