/**
 * 語音轉文字 Handler
 * 使用 OpenAI Whisper API 進行語音轉錄
 */

const OpenAI = require('openai');
const axios = require('axios');
const { Buffer } = require('buffer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 下載音訊檔案
 */
async function downloadAudio(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxContentLength: 25 * 1024 * 1024 // 25MB (Whisper 限制)
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Audio download error:', error);
    throw new Error('Failed to download audio file');
  }
}

/**
 * 轉錄音訊為文字
 */
async function transcribeAudio(audioData, options = {}) {
  try {
    const {
      language = null,  // null = 自動檢測
      prompt = null,  // 提示詞，幫助識別特定詞彙
      responseFormat = 'verbose_json',  // 'json', 'text', 'srt', 'vtt', 'verbose_json'
      temperature = 0
    } = options;

    // 創建 File 對象（Whisper API 需要）
    const file = new File([audioData], 'audio.mp3', { type: 'audio/mpeg' });

    const params = {
      file: file,
      model: 'whisper-1',
      response_format: responseFormat,
      temperature: temperature
    };

    if (language) {
      params.language = language;
    }

    if (prompt) {
      params.prompt = prompt;
    }

    const transcription = await openai.audio.transcriptions.create(params);

    // 根據格式處理回應
    if (responseFormat === 'verbose_json') {
      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments?.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text
        }))
      };
    } else if (responseFormat === 'json') {
      return {
        text: transcription.text
      };
    } else {
      // srt, vtt, text
      return {
        text: transcription
      };
    }
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * 翻譯音訊（將非英語音訊翻譯成英語）
 */
async function translateAudio(audioData) {
  try {
    const file = new File([audioData], 'audio.mp3', { type: 'audio/mpeg' });

    const translation = await openai.audio.translations.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json'
    });

    return {
      text: translation.text,
      duration: translation.duration
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * 生成時間軸字幕
 */
function generateSubtitles(segments, format = 'srt') {
  if (!segments || segments.length === 0) {
    return '';
  }

  if (format === 'srt') {
    return segments.map((seg, index) => {
      const startTime = formatTime(seg.start, 'srt');
      const endTime = formatTime(seg.end, 'srt');
      return `${index + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
    }).join('\n');
  } else if (format === 'vtt') {
    const content = segments.map((seg, index) => {
      const startTime = formatTime(seg.start, 'vtt');
      const endTime = formatTime(seg.end, 'vtt');
      return `${startTime} --> ${endTime}\n${seg.text}`;
    }).join('\n\n');
    return `WEBVTT\n\n${content}`;
  }

  return '';
}

/**
 * 格式化時間
 */
function formatTime(seconds, format = 'srt') {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (format === 'srt') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  } else {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
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
      audioUrl,
      audioBase64,  // 或者直接提供 base64 編碼的音訊
      action = 'transcribe',  // 'transcribe' or 'translate'
      options = {}
    } = body;

    // 驗證輸入
    if (!audioUrl && !audioBase64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either audioUrl or audioBase64 is required'
        })
      };
    }

    console.log(`Speech-to-Text Request - Action: ${action}`);

    // 獲取音訊數據
    let audioData;
    if (audioBase64) {
      audioData = Buffer.from(audioBase64, 'base64');
    } else {
      try {
        audioData = await downloadAudio(audioUrl);
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to download audio file. Please check the URL.'
          })
        };
      }
    }

    // 檢查檔案大小
    const sizeInMB = audioData.length / (1024 * 1024);
    if (sizeInMB > 25) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Audio file is too large (maximum 25MB)'
        })
      };
    }

    let result;

    if (action === 'translate') {
      result = await translateAudio(audioData);
      result.action = 'translate';
    } else {
      result = await transcribeAudio(audioData, options);
      result.action = 'transcribe';

      // 如果有片段資訊，生成字幕
      if (result.segments && options.generateSubtitles) {
        const subtitleFormat = options.subtitleFormat || 'srt';
        result.subtitles = generateSubtitles(result.segments, subtitleFormat);
        result.subtitleFormat = subtitleFormat;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        fileSize: `${sizeInMB.toFixed(2)} MB`,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Speech-to-Text Handler Error:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    } else if (error.message.includes('audio file')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};
