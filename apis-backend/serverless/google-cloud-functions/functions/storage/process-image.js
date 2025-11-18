/**
 * Cloud Storage 觸發函數
 * 當圖片上傳到 Storage 時自動處理
 */

const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const path = require('path');

const storage = new Storage();

/**
 * 生成縮圖
 */
async function generateThumbnails(file, context) {
  try {
    const bucket = storage.bucket(file.bucket);
    const filePath = file.name;
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);

    // 忽略已經是縮圖的文件
    if (fileName.includes('_thumb_') || fileDir.includes('thumbnails')) {
      console.log('Skipping thumbnail generation for:', fileName);
      return;
    }

    // 只處理圖片文件
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!imageTypes.includes(file.contentType)) {
      console.log('Not an image file:', file.contentType);
      return;
    }

    console.log('Processing image:', fileName);

    // 下載原始圖片
    const [imageBuffer] = await bucket.file(filePath).download();

    // 定義縮圖尺寸
    const sizes = [
      { name: 'small', width: 200, height: 200 },
      { name: 'medium', width: 400, height: 400 },
      { name: 'large', width: 800, height: 800 }
    ];

    // 生成多個尺寸的縮圖
    const uploadPromises = sizes.map(async (size) => {
      const thumbnail = await sharp(imageBuffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      const thumbFileName = `thumbnails/${size.name}_${fileName}`;
      const thumbFile = bucket.file(thumbFileName);

      await thumbFile.save(thumbnail, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalFile: filePath,
            thumbnailSize: size.name,
            generatedAt: new Date().toISOString()
          }
        }
      });

      console.log(`Generated ${size.name} thumbnail:`, thumbFileName);

      return thumbFileName;
    });

    await Promise.all(uploadPromises);

    console.log('All thumbnails generated successfully');
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * 提取圖片元數據
 */
async function extractMetadata(file) {
  try {
    const bucket = storage.bucket(file.bucket);
    const [imageBuffer] = await bucket.file(file.name).download();

    const metadata = await sharp(imageBuffer).metadata();

    // 更新文件元數據
    await bucket.file(file.name).setMetadata({
      metadata: {
        imageWidth: metadata.width,
        imageHeight: metadata.height,
        imageFormat: metadata.format,
        imageSize: file.size,
        processedAt: new Date().toISOString()
      }
    });

    console.log('Metadata extracted:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    });
  } catch (error) {
    console.error('Error extracting metadata:', error);
  }
}

/**
 * 主函數 - Storage 觸發器
 * 當文件上傳到 Cloud Storage 時觸發
 */
exports.processImage = async (file, context) => {
  console.log('Storage event:', {
    name: file.name,
    bucket: file.bucket,
    contentType: file.contentType,
    size: file.size,
    eventType: context.eventType
  });

  // 只處理新建文件事件
  if (context.eventType !== 'google.storage.object.finalize') {
    console.log('Skipping non-finalize event');
    return;
  }

  try {
    // 並行執行縮圖生成和元數據提取
    await Promise.all([
      generateThumbnails(file, context),
      extractMetadata(file)
    ]);

    console.log('Image processing completed');
  } catch (error) {
    console.error('Image processing failed:', error);
    // 不拋出錯誤，避免函數重試
  }
};

/**
 * 刪除文件觸發器
 * 當原始文件被刪除時，同時刪除相關的縮圖
 */
exports.onFileDelete = async (file, context) => {
  console.log('File deleted:', file.name);

  if (context.eventType !== 'google.storage.object.delete') {
    return;
  }

  try {
    const bucket = storage.bucket(file.bucket);
    const fileName = path.basename(file.name);

    // 刪除相關縮圖
    const sizes = ['small', 'medium', 'large'];
    const deletePromises = sizes.map(async (size) => {
      const thumbFileName = `thumbnails/${size}_${fileName}`;
      try {
        await bucket.file(thumbFileName).delete();
        console.log(`Deleted thumbnail: ${thumbFileName}`);
      } catch (error) {
        // 文件可能不存在，忽略錯誤
        console.log(`Thumbnail not found: ${thumbFileName}`);
      }
    });

    await Promise.all(deletePromises);

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
};
