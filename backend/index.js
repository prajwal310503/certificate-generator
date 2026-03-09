const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
require('dotenv').config();

const certificateRoutes = require('./routes/certificates');
const { downloadFile } = require('./services/supabaseService');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Direct HTTP/HTTPS fetch that follows redirects (up to 5).
 * Used as a fallback when Supabase admin download fails.
 */
function httpFetch(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return httpFetch(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        mimeType: res.headers['content-type'] || 'image/jpeg',
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * GET /api/proxy-image?url=...
 * 1. Tries Supabase admin client download (works even for private buckets).
 * 2. Falls back to direct HTTP fetch (works for public buckets).
 */
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url param required' });

  try {
    // Primary: Supabase admin client (handles private buckets, no CORS)
    let result = await downloadFile(url);

    // Fallback: direct HTTP fetch with redirect following (public buckets)
    if (!result) {
      try {
        result = await httpFetch(url);
      } catch (fetchErr) {
        console.warn('proxy-image direct fetch failed:', fetchErr.message);
      }
    }

    if (!result) {
      console.warn('proxy-image: could not retrieve', url);
      return res.status(404).end();
    }

    res.setHeader('Content-Type', result.mimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(result.buffer);
  } catch (err) {
    console.warn('proxy-image error:', err.message);
    res.status(500).end();
  }
});

app.use('/api/certificates', certificateRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Certificate Generator API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
