// Netlify Function: Hello World
// Path: /.netlify/functions/hello

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Main handler logic
  try {
    const response = {
      message: 'Hello from Netlify Functions!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      queryParams: event.queryStringParameters,
      clientInfo: {
        ip: event.headers['client-ip'] || event.headers['x-forwarded-for'],
        userAgent: event.headers['user-agent']
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
