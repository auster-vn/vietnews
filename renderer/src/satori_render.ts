import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import path from 'path';
import React from 'react';
import { ArticleTemplate, ArticleData } from './template';

// 1x1 black PNG fallback image
const FALLBACK_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Load fonts safely from adjacent fonts directory
const fontDir = path.resolve(__dirname, '../fonts');
const regFontPath = path.join(fontDir, 'Inter-Regular.ttf');
const boldFontPath = path.join(fontDir, 'Inter-Bold.ttf');
const regLoraPath = path.join(fontDir, 'Lora-Regular.ttf');
const boldLoraPath = path.join(fontDir, 'Lora-Bold.ttf');

let interReg: Buffer;
let interBold: Buffer;
let loraReg: Buffer;
let loraBold: Buffer;

try {
  interReg = readFileSync(regFontPath);
  interBold = readFileSync(boldFontPath);
  loraReg = readFileSync(regLoraPath);
  loraBold = readFileSync(boldLoraPath);
} catch (error) {
  try {
    interReg = readFileSync(path.resolve(process.cwd(), 'fonts/Inter-Regular.ttf'));
    interBold = readFileSync(path.resolve(process.cwd(), 'fonts/Inter-Bold.ttf'));
    loraReg = readFileSync(path.resolve(process.cwd(), 'fonts/Lora-Regular.ttf'));
    loraBold = readFileSync(path.resolve(process.cwd(), 'fonts/Lora-Bold.ttf'));
  } catch (err) {
    interReg = readFileSync(path.resolve(__dirname, '../../fonts/Inter-Regular.ttf'));
    interBold = readFileSync(path.resolve(__dirname, '../../fonts/Inter-Bold.ttf'));
    loraReg = readFileSync(path.resolve(__dirname, '../../fonts/Lora-Regular.ttf'));
    loraBold = readFileSync(path.resolve(__dirname, '../../fonts/Lora-Bold.ttf'));
  }
}

/**
 * Downloads an image and converts it to base64. 
 * Falls back to a 1x1 placeholder on network/validation errors.
 */
export async function fetchImageAsBase64(url?: string): Promise<{ base64: string; width: number; height: number }> {
  if (!url) {
    return { base64: FALLBACK_IMAGE_BASE64, width: 1200, height: 630 };
  }

  let targetUrl = url;
  if (url.toLowerCase().endsWith('.webp')) {
    targetUrl = url.substring(0, url.length - 5);
  }

  try {
    let response = await fetch(targetUrl, { signal: AbortSignal.timeout(4000) });
    
    if (!response.ok && targetUrl !== url) {
      response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    }

    if (!response.ok) {
      return { base64: FALLBACK_IMAGE_BASE64, width: 1200, height: 630 };
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // Get original dimensions from the fetched buffer (WebP, PNG, GIF, or JPEG)
    const dims = getImageDimensions(buffer);

    let finalContentType = contentType;
    let finalBuffer = buffer;

    // Convert WebP to JPEG using ImageMagick if available
    if (contentType.toLowerCase().includes('webp')) {
      try {
        const { spawnSync } = require('child_process');
        const convert = spawnSync('convert', ['webp:-', 'jpg:-'], {
          input: buffer,
          maxBuffer: 15 * 1024 * 1024
        });
        if (convert.status === 0 && convert.stdout && convert.stdout.length > 0) {
          finalBuffer = convert.stdout;
          finalContentType = 'image/jpeg';
        } else {
          console.warn('ImageMagick webp conversion failed, using fallback source but keeping original dimensions.');
          return { base64: FALLBACK_IMAGE_BASE64, width: dims.width, height: dims.height };
        }
      } catch (err) {
        console.warn('Failed to run convert subprocess for webp image, using fallback source but keeping original dimensions.');
        return { base64: FALLBACK_IMAGE_BASE64, width: dims.width, height: dims.height };
      }
    }

    const base64 = `data:${finalContentType};base64,${finalBuffer.toString('base64')}`;
    return {
      base64,
      width: dims.width,
      height: dims.height
    };
  } catch (error) {
    console.error(`Error fetching thumbnail image ${url}:`, error);
    return { base64: FALLBACK_IMAGE_BASE64, width: 1200, height: 630 };
  }
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } {
  // Check PNG
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504E47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  // Check GIF
  if (buffer.length > 10 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  // Check JPEG
  if (buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      if (marker === 0xD9 || marker === 0xDA) break; // EOI or SOS
      if (offset + 4 > buffer.length) break;
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xC0 && marker <= 0xC3) { // SOF0, SOF1, SOF2, SOF3
        if (offset + 9 > buffer.length) break;
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += length + 2;
    }
  }

  // Check WebP
  if (
    buffer.length > 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const type = buffer.toString('ascii', 12, 16);
    if (type === 'VP8 ' && buffer.length > 30) {
      const width = buffer.readUInt16LE(26) & 0x3FFF;
      const height = buffer.readUInt16LE(28) & 0x3FFF;
      return { width, height };
    }
    if (type === 'VP8L' && buffer.length > 25) {
      const b1 = buffer[21];
      const b2 = buffer[22];
      const b3 = buffer[23];
      const b4 = buffer[24];
      const width = ((b2 & 0x3F) << 8 | b1) + 1;
      const height = ((b4 & 0xF) << 10 | b3 << 2 | (b2 & 0xC0) >> 6) + 1;
      return { width, height };
    }
    if (type === 'VP8X' && buffer.length > 30) {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      return { width, height };
    }
  }

  // Default fallback if we cannot parse
  return { width: 1200, height: 630 };
}

export async function generatePng(article: ArticleData): Promise<{ buffer: Buffer; width: number; height: number }> {
  // Pre-fetch thumbnail as base64 and parse dimensions to avoid network failures crashing Satori
  const fetchResult = await fetchImageAsBase64(article.thumbnail_url);
  
  const resolvedArticle = {
    ...article,
    thumbnail_url: fetchResult.base64,
    image_width: fetchResult.width,
    image_height: fetchResult.height
  };

  const isPortrait = fetchResult.height > fetchResult.width;
  const cardWidth = isPortrait ? 630 : 1200;
  const cardHeight = isPortrait ? 1200 : 630;

  // Compile React JSX element into SVG
  const svg = await satori(
    React.createElement(ArticleTemplate, resolvedArticle),
    {
      width: cardWidth,
      height: cardHeight,
      fonts: [
        {
          name: 'Inter',
          data: interReg,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Lora',
          data: loraReg,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Lora',
          data: loraBold,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Render SVG text to raw PNG pixel buffer
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: cardWidth,
    },
  });

  const pngData = resvg.render();
  return {
    buffer: pngData.asPng(),
    width: cardWidth,
    height: cardHeight
  };
}
