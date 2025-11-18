/**
 * Image Optimizer HTTP Cloud Function
 * 圖片優化和處理服務
 */

const sharp = require('sharp');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

/**
 * 設定 CORS
 */
function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 下載圖片
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: 10 * 1024 * 1024 // 10MB
    });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

/**
 * 優化圖片
 */
async function optimizeImage(imageBuffer, options = {}) {
  try {
    const {
      width,
      height,
      quality = 80,
      format = 'jpeg',
      fit = 'cover'
    } = options;

    let pipeline = sharp(imageBuffer);

    // 調整大小
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: fit,
        withoutEnlargement: true
      });
    }

    // 轉換格式並優化
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        pipeline = pipeline.jpeg({
          quality,
          progressive: true,
          mozjpeg: true
        });
        break;

      case 'png':
        pipeline = pipeline.png({
          quality,
          compressionLevel: 9,
          adaptiveFiltering: true
        });
        break;

      case 'webp':
        pipeline = pipeline.webp({
          quality,
          effort: 6
        });
        break;

      case 'avif':
        pipeline = pipeline.avif({
          quality,
          effort: 4
        });
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return await pipeline.toBuffer();
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
}

/**
 * 獲取圖片資訊
 */
async function getImageInfo(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: imageBuffer.length
    };
  } catch (error) {
    throw new Error(`Failed to get image info: ${error.message}`);
  }
}

/**
 * 上傳到 Cloud Storage
 */
async function uploadToStorage(buffer, bucketName, fileName) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: `image/${fileName.split('.').pop()}`,
        cacheControl: 'public, max-age=31536000'
      },
      public: true
    });

    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  } catch (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }
}

/**
 * 主函數
 */
exports.imageOptimizer = async (req, res) => {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      imageUrl,
      imageBase64,
      width,
      height,
      quality = 80,
      format = 'jpeg',
      fit = 'cover',
      action = 'optimize',  // 'optimize', 'info', 'upload'
      bucketName,
      fileName
    } = req.body;

    // 驗證輸入
    if (!imageUrl && !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Either imageUrl or imageBase64 is required'
      });
    }

    console.log(`Image Optimizer - Action: ${action}, Format: ${format}`);

    // 獲取圖片數據
    let imageBuffer;
    if (imageBase64) {
      imageBuffer = Buffer.from(imageBase64, 'base64');
    } else {
      imageBuffer = await downloadImage(imageUrl);
    }

    // 執行操作
    let result;

    switch (action) {
      case 'info':
        const info = await getImageInfo(imageBuffer);
        result = {
          success: true,
          action: 'info',
          data: info
        };
        break;

      case 'upload':
        if (!bucketName || !fileName) {
          return res.status(400).json({
            success: false,
            error: 'bucketName and fileName are required for upload action'
          });
        }

        // 先優化，再上傳
        const optimizedBuffer = await optimizeImage(imageBuffer, {
          width,
          height,
          quality,
          format,
          fit
        });

        const url = await uploadToStorage(optimizedBuffer, bucketName, fileName);

        result = {
          success: true,
          action: 'upload',
          data: {
            url,
            bucket: bucketName,
            fileName,
            size: optimizedBuffer.length
          }
        };
        break;

      case 'optimize':
      default:
        const originalInfo = await getImageInfo(imageBuffer);
        const optimized = await optimizeImage(imageBuffer, {
          width,
          height,
          quality,
          format,
          fit
        });
        const optimizedInfo = await getImageInfo(optimized);

        result = {
          success: true,
          action: 'optimize',
          data: {
            original: {
              size: originalInfo.size,
              format: originalInfo.format,
              width: originalInfo.width,
              height: originalInfo.height
            },
            optimized: {
              size: optimizedInfo.size,
              format: optimizedInfo.format,
              width: optimizedInfo.width,
              height: optimizedInfo.height,
              image: optimized.toString('base64')
            },
            compression: {
              ratio: ((1 - optimizedInfo.size / originalInfo.size) * 100).toFixed(2) + '%',
              saved: originalInfo.size - optimizedInfo.size
            }
          }
        };
    }

    res.status(200).json({
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image Optimizer Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
