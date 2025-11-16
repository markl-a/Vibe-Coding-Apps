// Netlify Function: Form Submit Handler
// Path: /.netlify/functions/form-submit
// Handles form submissions and can integrate with email services

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'This endpoint only accepts POST requests'
      })
    };
  }

  try {
    // Parse the request body
    const data = JSON.parse(event.body);

    // Validate required fields
    const { name, email, message } = data;

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Missing required fields',
          required: ['name', 'email', 'message']
        })
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format'
        })
      };
    }

    // Here you would typically:
    // 1. Send email using a service like SendGrid, Mailgun, or SES
    // 2. Store in database
    // 3. Send to Slack/Discord webhook
    // 4. Add to CRM system

    console.log('Form submission received:', { name, email, message });

    // Simulate successful processing
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Form submitted successfully!',
        submissionId,
        data: {
          name,
          email,
          receivedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Error processing form submission:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process form submission',
        message: error.message
      })
    };
  }
};
