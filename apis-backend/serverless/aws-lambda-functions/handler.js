// AWS Lambda Functions Handler
// Multiple functions in one file for demonstration

/**
 * Hello World Function
 * Basic Lambda function example
 */
module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Hello from AWS Lambda!',
      timestamp: new Date().toISOString(),
      requestId: event.requestContext?.requestId,
      input: event
    })
  };
};

/**
 * User Management Function
 * Handles user CRUD operations
 */
module.exports.users = async (event) => {
  const method = event.httpMethod;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Mock user data
    const users = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ];

    switch (method) {
      case 'GET':
        const userId = event.pathParameters?.id;
        if (userId) {
          const user = users.find(u => u.id === userId);
          if (!user) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'User not found' })
            };
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(user)
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ users })
        };

      case 'POST':
        const newUser = JSON.parse(event.body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'User created',
            user: { id: '3', ...newUser }
          })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Image Processing Function
 * Triggered by S3 events
 */
module.exports.processImage = async (event) => {
  console.log('S3 Event:', JSON.stringify(event, null, 2));

  try {
    // Process each S3 record
    const results = await Promise.all(
      event.Records.map(async (record) => {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const size = record.s3.object.size;

        console.log(`Processing: ${bucket}/${key} (${size} bytes)`);

        // Here you would typically:
        // 1. Download the image from S3
        // 2. Resize/optimize using Sharp or similar
        // 3. Upload the processed image back to S3
        // 4. Update database with metadata

        return {
          bucket,
          key,
          size,
          status: 'processed',
          timestamp: new Date().toISOString()
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Images processed successfully',
        results
      })
    };
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
};

/**
 * Email Sender Function
 * Sends emails using AWS SES
 */
module.exports.sendEmail = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { to, subject, message } = JSON.parse(event.body);

    // Validate input
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: to, subject, message'
        })
      };
    }

    // Here you would integrate with AWS SES:
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES({ region: process.env.AWS_REGION });
    // await ses.sendEmail(params).promise();

    console.log('Email sent:', { to, subject });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Email sent successfully',
        to,
        subject,
        sentAt: new Date().toISOString()
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Data Processor Function
 * Processes messages from SQS queue
 */
module.exports.processData = async (event) => {
  console.log('SQS Event:', JSON.stringify(event, null, 2));

  try {
    // Process each SQS message
    const results = await Promise.all(
      event.Records.map(async (record) => {
        const messageBody = JSON.parse(record.body);
        console.log('Processing message:', messageBody);

        // Here you would typically:
        // 1. Validate the data
        // 2. Transform/process the data
        // 3. Store in database
        // 4. Trigger other workflows

        return {
          messageId: record.messageId,
          status: 'processed',
          data: messageBody
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processed successfully',
        processed: results.length,
        results
      })
    };
  } catch (error) {
    console.error('Error processing data:', error);
    throw error;
  }
};

/**
 * Scheduled Task Function
 * Runs on a schedule (cron)
 */
module.exports.scheduledTask = async (event) => {
  console.log('Scheduled task triggered:', new Date().toISOString());

  try {
    // Here you would perform scheduled tasks:
    // - Database cleanup
    // - Report generation
    // - Data synchronization
    // - Health checks

    const result = {
      taskName: 'Daily Cleanup',
      executedAt: new Date().toISOString(),
      status: 'completed',
      itemsProcessed: 42
    };

    console.log('Task result:', result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Scheduled task error:', error);
    throw error;
  }
};
