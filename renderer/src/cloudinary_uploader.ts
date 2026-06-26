import { v2 as cloudinary } from 'cloudinary';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { generatePng } from './satori_render';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads a raw PNG buffer directly to Cloudinary using a write stream.
 * Returns the secure CDN URL of the uploaded image.
 */
export async function uploadBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'vietnews' },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned empty result'));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Connects to Neon Postgres (or local JSON DB), fetches unrendered high-scoring articles, 
 * generates images for them, uploads to Cloudinary (or saves locally), and updates their DB records.
 */
export async function processUnrenderedArticles(limit: number = 5): Promise<number> {
  const dbUrl = process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    console.log('NEON_DATABASE_URL is missing. Using local JSON database mode.');
    // Local JSON Database flow
    const baseDir = path.resolve(__dirname, '../..');
    const jsonPath = path.join(baseDir, 'vietnews.json');
    
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify([], null, 2), 'utf-8');
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: any[] = JSON.parse(fileContent);
    
    // Select unrendered articles (hot ones only)
    const unrendered = data
      .filter(item => !item.is_rendered && (item.hot_score || 0) >= 60)
      .sort((a, b) => (b.hot_score || 0) - (a.hot_score || 0))
      .slice(0, limit);
      
    let processedCount = 0;
    for (const row of unrendered) {
      try {
        const article = {
          title: row.title,
          summary: row.summary,
          category: row.category,
          thumbnail_url: row.thumbnail_url,
          hot_score: row.hot_score,
          published_at: row.published_at
        };
        
        // Render JSX -> SVG -> PNG
        const { buffer, width, height } = await generatePng(article);
        
        // Save locally
        const uploadsDir = path.join(baseDir, 'frontend', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const fileName = `${row.id}.png`;
        const localPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localPath, buffer);
        const imageUrl = `/uploads/${fileName}`;
        
        // Update database in JSON
        row.rendered_image_url = imageUrl;
        row.is_rendered = true;
        row.image_width = width;
        row.image_height = height;
        row.updated_at = new Date().toISOString();
        
        processedCount++;
      } catch (err) {
        console.error(`Failed to process article ID ${row.id} locally:`, err);
      }
    }
    
    if (processedCount > 0) {
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
    }
    
    return processedCount;
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    // Select articles needing image rendering (hot ones only)
    const res = await client.query(
      `SELECT id, title, summary, category, thumbnail_url, hot_score, published_at 
       FROM articles 
       WHERE is_rendered = FALSE AND hot_score >= 60
       ORDER BY hot_score DESC, created_at DESC 
       LIMIT $1`,
      [limit]
    );

    let processedCount = 0;
    for (const row of res.rows) {
      try {
        const article = {
          title: row.title,
          summary: row.summary,
          category: row.category,
          thumbnail_url: row.thumbnail_url,
          hot_score: row.hot_score,
          published_at: row.published_at ? row.published_at.toISOString() : ''
        };

        // Render JSX -> SVG -> PNG
        const { buffer, width, height } = await generatePng(article);

        // Upload to Cloudinary CDN
        const secureUrl = await uploadBuffer(buffer);

        // Update database record
        await client.query(
          `UPDATE articles 
           SET rendered_image_url = $1, is_rendered = TRUE, image_width = $2, image_height = $3, updated_at = NOW() 
           WHERE id = $4`,
          [secureUrl, width, height, row.id]
        );

        processedCount++;
      } catch (err) {
        console.error(`Failed to process article ID ${row.id}:`, err);
      }
    }

    return processedCount;
  } finally {
    await client.end();
  }
}

/**
 * Fetches a single article by ID, renders its image,
 * uploads to Cloudinary (or saves locally), updates the database, and returns true on success.
 */
export async function renderSingleArticle(id: string): Promise<boolean> {
  const dbUrl = process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    console.log('NEON_DATABASE_URL is missing. Using local JSON database mode.');
    const baseDir = path.resolve(__dirname, '../..');
    const jsonPath = path.join(baseDir, 'vietnews.json');
    
    if (!fs.existsSync(jsonPath)) {
      return false;
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const data: any[] = JSON.parse(fileContent);
    
    const row = data.find(item => item.id === id);
    if (!row) {
      console.warn(`Article ID ${id} not found for single rendering locally.`);
      return false;
    }
    
    const article = {
      title: row.title,
      summary: row.summary,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      hot_score: row.hot_score,
      published_at: row.published_at
    };
    
    const { buffer, width, height } = await generatePng(article);
    
    const uploadsDir = path.join(baseDir, 'frontend', 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileName = `${id}.png`;
    const localPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(localPath, buffer);
    const imageUrl = `/uploads/${fileName}`;
    
    row.rendered_image_url = imageUrl;
    row.is_rendered = true;
    row.image_width = width;
    row.image_height = height;
    row.updated_at = new Date().toISOString();
    
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const res = await client.query(
      `SELECT id, title, summary, category, thumbnail_url, hot_score, published_at 
       FROM articles 
       WHERE id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      console.warn(`Article ID ${id} not found for single rendering.`);
      return false;
    }

    const row = res.rows[0];
    const article = {
      title: row.title,
      summary: row.summary,
      category: row.category,
      thumbnail_url: row.thumbnail_url,
      hot_score: row.hot_score,
      published_at: row.published_at ? row.published_at.toISOString() : ''
    };

    // Render JSX -> SVG -> PNG
    const { buffer, width, height } = await generatePng(article);

    // Upload to Cloudinary CDN
    const secureUrl = await uploadBuffer(buffer);

    // Update database record
    await client.query(
      `UPDATE articles 
       SET rendered_image_url = $1, is_rendered = TRUE, image_width = $2, image_height = $3, updated_at = NOW() 
       WHERE id = $4`,
      [secureUrl, width, height, id]
    );

    return true;
  } catch (err) {
    console.error(`Failed to render single article ID ${id}:`, err);
    return false;
  } finally {
    await client.end();
  }
}
