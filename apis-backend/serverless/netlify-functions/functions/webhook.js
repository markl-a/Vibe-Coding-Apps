// Netlify Function: Webhook Handler
// Path: /.netlify/functions/webhook
// Handles webhooks from third-party services (GitHub, Stripe, etc.)

const crypto = require('crypto');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256',
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
        error: 'Method Not Allowed'
      })
    };
  }

  try {
    // Verify webhook signature (example for GitHub webhooks)
    const signature = event.headers['x-hub-signature-256'];
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = 'sha256=' + hmac.update(event.body).digest('hex');

      if (signature !== digest) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'Invalid signature'
          })
        };
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(event.body);
    const eventType = event.headers['x-github-event'] ||
                      event.headers['x-webhook-event'] ||
                      payload.type ||
                      'unknown';

    console.log('Webhook received:', {
      type: eventType,
      timestamp: new Date().toISOString()
    });

    // Handle different webhook types
    let response;

    switch (eventType) {
      case 'push':
        response = await handlePushEvent(payload);
        break;

      case 'pull_request':
        response = await handlePullRequestEvent(payload);
        break;

      case 'issues':
        response = await handleIssuesEvent(payload);
        break;

      default:
        response = {
          message: `Webhook received: ${eventType}`,
          processed: true
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        eventType,
        response
      })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process webhook',
        message: error.message
      })
    };
  }
};

// Handler functions for different event types
async function handlePushEvent(payload) {
  const { repository, commits, pusher } = payload;

  return {
    type: 'push',
    repository: repository?.full_name,
    commits: commits?.length || 0,
    pusher: pusher?.name,
    message: 'Push event processed'
  };
}

async function handlePullRequestEvent(payload) {
  const { action, pull_request, repository } = payload;

  return {
    type: 'pull_request',
    action,
    repository: repository?.full_name,
    pr: {
      number: pull_request?.number,
      title: pull_request?.title,
      state: pull_request?.state
    },
    message: `Pull request ${action}`
  };
}

async function handleIssuesEvent(payload) {
  const { action, issue, repository } = payload;

  return {
    type: 'issues',
    action,
    repository: repository?.full_name,
    issue: {
      number: issue?.number,
      title: issue?.title,
      state: issue?.state
    },
    message: `Issue ${action}`
  };
}
