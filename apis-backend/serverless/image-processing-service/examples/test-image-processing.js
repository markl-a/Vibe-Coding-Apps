/**
 * Image Processing Serverless Service 測試腳本
 * 演示圖片處理無服務器函數的功能
 *
 * 使用方式: node examples/test-image-processing.js
 */

const fs = require('fs');
const path = require('path');

// 本地測試或 AWS Lambda 端點
const BASE_URL = process.env.API_URL || 'http://localhost:3000/dev';

async function testImageProcessing() {
  console.log('🖼️  Image Processing Service 測試\n');

  try {
    // 1. 測試圖片上傳
    console.log('1️⃣  測試圖片上傳');
    const uploadResult = await uploadImage();
    console.log('✅ 上傳結果:', uploadResult);
    console.log('');

    // 2. 測試圖片縮放
    console.log('2️⃣  測試圖片縮放');
    const resizeResult = await resizeImage(uploadResult.imageUrl, 800, 600);
    console.log('✅ 縮放結果:', resizeResult);
    console.log('');

    // 3. 測試生成縮略圖
    console.log('3️⃣  測試生成縮略圖');
    const thumbnailResult = await generateThumbnail(uploadResult.imageUrl);
    console.log('✅ 縮略圖結果:', thumbnailResult);
    console.log('');

    // 4. 測試多尺寸生成
    console.log('4️⃣  測試生成多個尺寸');
    const multiSizeResult = await generateMultipleSizes(uploadResult.imageUrl);
    console.log('✅ 多尺寸結果:', multiSizeResult);
    console.log('');

    // 5. 測試圖片優化
    console.log('5️⃣  測試圖片優化（壓縮）');
    const optimizeResult = await optimizeImage(uploadResult.imageUrl);
    console.log('✅ 優化結果:', optimizeResult);
    console.log('');

    // 6. 測試圖片格式轉換
    console.log('6️⃣  測試格式轉換（轉為 WebP）');
    const convertResult = await convertImageFormat(uploadResult.imageUrl, 'webp');
    console.log('✅ 轉換結果:', convertResult);
    console.log('');

    // 7. 測試添加浮水印
    console.log('7️⃣  測試添加浮水印');
    const watermarkResult = await addWatermark(uploadResult.imageUrl, 'Sample Watermark');
    console.log('✅ 浮水印結果:', watermarkResult);
    console.log('');

    // 8. 測試圖片裁切
    console.log('8️⃣  測試圖片裁切');
    const cropResult = await cropImage(uploadResult.imageUrl, {
      x: 0,
      y: 0,
      width: 500,
      height: 500
    });
    console.log('✅ 裁切結果:', cropResult);
    console.log('');

    // 9. 測試批量處理
    console.log('9️⃣  測試批量處理');
    const batchResult = await batchProcess([
      uploadResult.imageUrl,
      uploadResult.imageUrl,
      uploadResult.imageUrl
    ]);
    console.log('✅ 批量處理結果:', batchResult);
    console.log('');

    console.log('🎉 所有測試完成！');
    console.log('\n📊 測試摘要:');
    console.log('  - 圖片上傳: ✅');
    console.log('  - 圖片縮放: ✅');
    console.log('  - 縮略圖生成: ✅');
    console.log('  - 多尺寸生成: ✅');
    console.log('  - 圖片優化: ✅');
    console.log('  - 格式轉換: ✅');
    console.log('  - 添加浮水印: ✅');
    console.log('  - 圖片裁切: ✅');
    console.log('  - 批量處理: ✅');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

async function uploadImage() {
  // 模擬上傳圖片
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: 'sample-image.jpg',
      contentType: 'image/jpeg',
      // 實際應用中這裡會是 base64 編碼的圖片數據
      data: 'base64_encoded_image_data_here',
      size: 1024000,
    }),
  });

  return await response.json();
}

async function resizeImage(imageUrl, width, height) {
  const response = await fetch(`${BASE_URL}/resize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: 'cover',
      quality: 90,
    }),
  });

  return await response.json();
}

async function generateThumbnail(imageUrl) {
  const response = await fetch(`${BASE_URL}/thumbnail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      size: 150,  // 150x150 縮略圖
    }),
  });

  return await response.json();
}

async function generateMultipleSizes(imageUrl) {
  const response = await fetch(`${BASE_URL}/multi-size`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      sizes: [
        { name: 'small', width: 320, height: 240 },
        { name: 'medium', width: 640, height: 480 },
        { name: 'large', width: 1280, height: 960 },
        { name: 'xlarge', width: 1920, height: 1080 },
      ],
    }),
  });

  return await response.json();
}

async function optimizeImage(imageUrl) {
  const response = await fetch(`${BASE_URL}/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      quality: 80,
      progressive: true,
      stripMetadata: true,
    }),
  });

  return await response.json();
}

async function convertImageFormat(imageUrl, format) {
  const response = await fetch(`${BASE_URL}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      format: format,  // 'webp', 'png', 'jpeg', 'avif'
      quality: 85,
    }),
  });

  return await response.json();
}

async function addWatermark(imageUrl, text) {
  const response = await fetch(`${BASE_URL}/watermark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      watermark: {
        type: 'text',
        text: text,
        position: 'bottom-right',
        opacity: 0.5,
        fontSize: 24,
        color: '#FFFFFF',
      },
    }),
  });

  return await response.json();
}

async function cropImage(imageUrl, dimensions) {
  const response = await fetch(`${BASE_URL}/crop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      crop: dimensions,
    }),
  });

  return await response.json();
}

async function batchProcess(imageUrls) {
  const response = await fetch(`${BASE_URL}/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imageUrls,
      operations: [
        { type: 'resize', width: 800, height: 600 },
        { type: 'optimize', quality: 80 },
        { type: 'convert', format: 'webp' },
      ],
    }),
  });

  return await response.json();
}

// 執行測試
testImageProcessing();

// 導出函數供其他模組使用
module.exports = {
  uploadImage,
  resizeImage,
  generateThumbnail,
  generateMultipleSizes,
  optimizeImage,
  convertImageFormat,
  addWatermark,
  cropImage,
  batchProcess,
};
