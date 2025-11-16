// POST /api/shorten
// URL shortener service
// GET /api/shorten?code=abc123 - Redirect to original URL

// Simple in-memory storage (in production, use a database)
const urlMap = new Map();

// Helper to generate short code
function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Redirect to original URL
    if (req.method === 'GET') {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Missing code parameter'
        });
      }

      const originalUrl = urlMap.get(code);

      if (!originalUrl) {
        return res.status(404).json({
          success: false,
          error: 'Short URL not found'
        });
      }

      // Redirect to original URL
      return res.redirect(302, originalUrl);
    }

    // POST - Create short URL
    if (req.method === 'POST') {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: url'
        });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        });
      }

      // Generate short code
      let shortCode = generateShortCode();

      // Ensure uniqueness
      while (urlMap.has(shortCode)) {
        shortCode = generateShortCode();
      }

      // Store mapping
      urlMap.set(shortCode, url);

      // Create short URL
      const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
      const shortUrl = `${baseUrl}/api/shorten?code=${shortCode}`;

      return res.status(201).json({
        success: true,
        data: {
          originalUrl: url,
          shortUrl,
          shortCode,
          createdAt: new Date().toISOString()
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
