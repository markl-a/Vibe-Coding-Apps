// POST /api/qrcode
// Generate QR code from text or URL

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { text, size = 200 } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
    }

    // In a real app, you would use a QR code library like 'qrcode'
    // const QRCode = require('qrcode');
    // const qrCodeDataURL = await QRCode.toDataURL(text, { width: size });

    // Mock QR code URL (using a free API)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

    return res.status(200).json({
      success: true,
      data: {
        text,
        size,
        qrCodeUrl,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate QR code',
      message: error.message
    });
  }
}
