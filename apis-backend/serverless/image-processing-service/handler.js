// Image Processing Service Handler
// Serverless image processing API

const crypto = require('crypto');

/**
 * Upload Image Handler
 * POST /upload
 */
module.exports.upload = async (event) => {
  const headers = getCorsHeaders();

  try {
    // Verify API Key
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!verifyApiKey(apiKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    // Parse multipart form data (in production, use a library like busboy)
    // For demonstration, we'll simulate the upload

    // Generate unique filename
    const filename = generateFilename('jpg');
    const imageUrl = `https://example.com/images/${filename}`;

    // In production, you would:
    // 1. Parse the multipart form data
    // 2. Validate file type and size
    // 3. Process the image with Sharp
    // 4. Upload to S3
    // 5. Return the URL

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: imageUrl,
          filename,
          size: 245678,
          width: 1920,
          height: 1080,
          uploadedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to upload image',
        message: error.message
      })
    };
  }
};

/**
 * Resize Image Handler
 * POST /resize
 */
module.exports.resize = async (event) => {
  const headers = getCorsHeaders();

  try {
    // Verify API Key
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!verifyApiKey(apiKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    const body = JSON.parse(event.body);
    const { imageUrl, width, height, fit = 'cover' } = body;

    // Validate inputs
    if (!imageUrl || !width || !height) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: imageUrl, width, height'
        })
      };
    }

    // In production, you would:
    // 1. Fetch the image from imageUrl
    // 2. Use Sharp to resize
    // 3. Upload to S3
    // 4. Return the new URL

    const resizedFilename = `resized_${width}x${height}_${generateFilename('jpg')}`;
    const resizedUrl = `https://example.com/resized/${resizedFilename}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Image resized successfully',
        data: {
          originalUrl: imageUrl,
          resizedUrl,
          width,
          height,
          fit,
          processedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Resize error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to resize image',
        message: error.message
      })
    };
  }
};

/**
 * Convert Image Format Handler
 * POST /convert
 */
module.exports.convert = async (event) => {
  const headers = getCorsHeaders();

  try {
    // Verify API Key
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!verifyApiKey(apiKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    const body = JSON.parse(event.body);
    const { imageUrl, format, quality = 80 } = body;

    // Validate inputs
    if (!imageUrl || !format) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields: imageUrl, format'
        })
      };
    }

    // Validate format
    const allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Invalid format. Allowed: ${allowedFormats.join(', ')}`
        })
      };
    }

    // In production, you would:
    // 1. Fetch the image from imageUrl
    // 2. Use Sharp to convert format
    // 3. Upload to S3
    // 4. Return the new URL

    const convertedFilename = generateFilename(format);
    const convertedUrl = `https://example.com/converted/${convertedFilename}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Image converted successfully',
        data: {
          originalUrl: imageUrl,
          convertedUrl,
          format,
          quality,
          processedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Convert error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to convert image',
        message: error.message
      })
    };
  }
};

/**
 * Optimize Image Handler
 * POST /optimize
 */
module.exports.optimize = async (event) => {
  const headers = getCorsHeaders();

  try {
    // Verify API Key
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!verifyApiKey(apiKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    const body = JSON.parse(event.body);
    const { imageUrl, quality = 85 } = body;

    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required field: imageUrl'
        })
      };
    }

    // In production, you would:
    // 1. Fetch the image
    // 2. Use Sharp to optimize
    // 3. Upload to S3
    // 4. Return the optimized URL

    const optimizedFilename = `optimized_${generateFilename('jpg')}`;
    const optimizedUrl = `https://example.com/optimized/${optimizedFilename}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Image optimized successfully',
        data: {
          originalUrl: imageUrl,
          optimizedUrl,
          quality,
          originalSize: 1024000,
          optimizedSize: 512000,
          savings: '50%',
          processedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Optimize error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to optimize image',
        message: error.message
      })
    };
  }
};

/**
 * Batch Process Images Handler
 * POST /batch
 */
module.exports.batch = async (event) => {
  const headers = getCorsHeaders();

  try {
    // Verify API Key
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (!verifyApiKey(apiKey)) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized: Invalid API key' })
      };
    }

    const body = JSON.parse(event.body);
    const { images } = body;

    if (!images || !Array.isArray(images)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing or invalid field: images (must be an array)'
        })
      };
    }

    // Process each image (in production, use Promise.all for parallel processing)
    const results = images.map(image => ({
      originalUrl: image.url,
      processedUrl: `https://example.com/processed/${generateFilename('jpg')}`,
      operations: image.operations,
      status: 'processed'
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${results.length} images`,
        data: {
          results,
          totalProcessed: results.length,
          processedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Batch processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process images',
        message: error.message
      })
    };
  }
};

// Helper functions

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function verifyApiKey(apiKey) {
  const validApiKey = process.env.API_KEY || 'demo-api-key';
  return apiKey === validApiKey;
}

function generateFilename(extension) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}.${extension}`;
}
