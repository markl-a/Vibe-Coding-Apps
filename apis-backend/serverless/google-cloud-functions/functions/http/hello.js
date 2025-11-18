/**
 * Hello World HTTP Cloud Function
 * 基礎的 HTTP 端點示例
 */

/**
 * HTTP Cloud Function
 * @param {Object} req Cloud Function request context
 * @param {Object} res Cloud Function response context
 */
exports.helloWorld = (req, res) => {
  // 設定 CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 從 query 或 body 獲取參數
  const name = req.query.name || req.body.name || 'World';
  const language = req.query.lang || req.body.lang || 'en';

  // 多語言問候語
  const greetings = {
    'en': 'Hello',
    'zh': '你好',
    'zh-TW': '你好',
    'ja': 'こんにちは',
    'ko': '안녕하세요',
    'es': 'Hola',
    'fr': 'Bonjour',
    'de': 'Hallo'
  };

  const greeting = greetings[language] || greetings['en'];

  // 記錄請求
  console.log(`Request from ${req.ip}, name: ${name}, language: ${language}`);

  // 返回回應
  res.status(200).json({
    message: `${greeting}, ${name}!`,
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type')
    },
    ip: req.ip,
    environment: {
      functionName: process.env.FUNCTION_NAME,
      functionRegion: process.env.FUNCTION_REGION,
      gcpProject: process.env.GCP_PROJECT
    }
  });
};

/**
 * 健康檢查端點
 */
exports.healthCheck = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.FUNCTION_VERSION || '1.0.0'
  });
};
