/**
 * 圖片識別 Handler
 * 使用 AWS Rekognition 和 OpenAI Vision API 進行圖片分析
 */

const { RekognitionClient, DetectLabelsCommand, DetectTextCommand, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
const OpenAI = require('openai');
const axios = require('axios');

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 下載圖片為 Buffer
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
    console.error('Image download error:', error);
    throw new Error('Failed to download image');
  }
}

/**
 * 使用 AWS Rekognition 進行物體識別
 */
async function detectObjects(imageBuffer) {
  try {
    const command = new DetectLabelsCommand({
      Image: { Bytes: imageBuffer },
      MaxLabels: 20,
      MinConfidence: 70
    });

    const response = await rekognition.send(command);

    return response.Labels.map(label => ({
      name: label.Name,
      confidence: Math.round(label.Confidence * 100) / 100,
      categories: label.Categories?.map(cat => cat.Name) || []
    }));
  } catch (error) {
    console.error('Object detection error:', error);
    throw error;
  }
}

/**
 * 使用 AWS Rekognition 進行文字識別 (OCR)
 */
async function detectText(imageBuffer) {
  try {
    const command = new DetectTextCommand({
      Image: { Bytes: imageBuffer }
    });

    const response = await rekognition.send(command);

    return response.TextDetections
      .filter(text => text.Type === 'LINE')
      .map(text => ({
        text: text.DetectedText,
        confidence: Math.round(text.Confidence * 100) / 100
      }));
  } catch (error) {
    console.error('Text detection error:', error);
    throw error;
  }
}

/**
 * 使用 AWS Rekognition 進行人臉識別
 */
async function detectFaces(imageBuffer) {
  try {
    const command = new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ['ALL']
    });

    const response = await rekognition.send(command);

    return response.FaceDetails.map(face => ({
      ageRange: face.AgeRange,
      gender: face.Gender.Value,
      emotions: face.Emotions
        .sort((a, b) => b.Confidence - a.Confidence)
        .slice(0, 3)
        .map(emotion => ({
          type: emotion.Type,
          confidence: Math.round(emotion.Confidence * 100) / 100
        })),
      quality: {
        brightness: Math.round(face.Quality.Brightness * 100) / 100,
        sharpness: Math.round(face.Quality.Sharpness * 100) / 100
      }
    }));
  } catch (error) {
    console.error('Face detection error:', error);
    throw error;
  }
}

/**
 * 使用 OpenAI Vision API 生成圖片描述
 */
async function generateImageDescription(imageUrl) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "請詳細描述這張圖片的內容，包括主要物體、場景、顏色、氛圍等。用繁體中文回答。"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Image description error:', error);
    // 如果 Vision API 失敗，返回 null 而不是拋出錯誤
    return null;
  }
}

/**
 * Lambda Handler
 */
module.exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      imageUrl,
      features = ['objects', 'text', 'faces', 'description']
    } = body;

    // 驗證輸入
    if (!imageUrl || typeof imageUrl !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Image URL is required'
        })
      };
    }

    // 驗證 URL 格式
    try {
      new URL(imageUrl);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid image URL format'
        })
      };
    }

    console.log(`Image Recognition Request - URL: ${imageUrl}, Features: ${features.join(', ')}`);

    const result = {
      imageUrl,
      features: {}
    };

    // 下載圖片
    let imageBuffer;
    if (features.some(f => ['objects', 'text', 'faces'].includes(f))) {
      try {
        imageBuffer = await downloadImage(imageUrl);
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to download image. Please check the URL.'
          })
        };
      }
    }

    // 執行請求的分析
    const analysisPromises = [];

    if (features.includes('objects')) {
      analysisPromises.push(
        detectObjects(imageBuffer)
          .then(objects => { result.features.objects = objects; })
          .catch(err => { result.features.objects = { error: err.message }; })
      );
    }

    if (features.includes('text')) {
      analysisPromises.push(
        detectText(imageBuffer)
          .then(texts => { result.features.text = texts; })
          .catch(err => { result.features.text = { error: err.message }; })
      );
    }

    if (features.includes('faces')) {
      analysisPromises.push(
        detectFaces(imageBuffer)
          .then(faces => { result.features.faces = faces; })
          .catch(err => { result.features.faces = { error: err.message }; })
      );
    }

    if (features.includes('description')) {
      analysisPromises.push(
        generateImageDescription(imageUrl)
          .then(desc => { result.features.description = desc; })
          .catch(err => { result.features.description = { error: err.message }; })
      );
    }

    await Promise.all(analysisPromises);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Image Recognition Handler Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};
