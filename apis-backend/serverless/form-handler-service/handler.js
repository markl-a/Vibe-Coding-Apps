// Form Handler Service
// Serverless form processing API

const crypto = require('crypto');

/**
 * Contact Form Handler
 * POST /submit/contact
 */
module.exports.submitContact = async (event) => {
  const headers = getCorsHeaders();

  try {
    const body = JSON.parse(event.body);
    const { name, email, subject, message, recaptchaToken } = body;

    // Validate required fields
    const validation = validateContactForm({ name, email, subject, message });
    if (!validation.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        })
      };
    }

    // Verify reCAPTCHA (if provided)
    if (recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const isValid = await verifyRecaptcha(recaptchaToken);
      if (!isValid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'reCAPTCHA verification failed'
          })
        };
      }
    }

    // Generate submission ID
    const submissionId = generateSubmissionId();

    // In production:
    // 1. Save to database (DynamoDB, MongoDB)
    // 2. Send email to admin
    // 3. Send confirmation email to user
    // 4. Send Slack notification (optional)

    console.log('Contact form submission:', {
      submissionId,
      name,
      email,
      subject
    });

    // Simulate email sending
    await sendEmail({
      to: email,
      subject: 'Thank you for contacting us',
      html: `<p>Hi ${name},</p><p>We received your message and will get back to you soon.</p>`
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Form submitted successfully',
        submissionId,
        data: {
          name,
          email,
          submittedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Contact form error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process form',
        message: error.message
      })
    };
  }
};

/**
 * Newsletter Subscription Handler
 * POST /submit/newsletter
 */
module.exports.submitNewsletter = async (event) => {
  const headers = getCorsHeaders();

  try {
    const body = JSON.parse(event.body);
    const { email, name, preferences = {} } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Valid email is required'
        })
      };
    }

    const subscriptionId = generateSubmissionId();

    // In production:
    // 1. Save to email marketing service (Mailchimp, SendGrid)
    // 2. Save to database
    // 3. Send welcome email

    console.log('Newsletter subscription:', {
      subscriptionId,
      email,
      name,
      preferences
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Successfully subscribed to newsletter',
        subscriptionId,
        data: {
          email,
          subscribedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to subscribe',
        message: error.message
      })
    };
  }
};

/**
 * Feedback Form Handler
 * POST /submit/feedback
 */
module.exports.submitFeedback = async (event) => {
  const headers = getCorsHeaders();

  try {
    const body = JSON.parse(event.body);
    const { name, email, rating, category, feedback, screenshot } = body;

    // Validate
    if (!email || !feedback) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Email and feedback are required'
        })
      };
    }

    if (rating && (rating < 1 || rating > 5)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Rating must be between 1 and 5'
        })
      };
    }

    const feedbackId = generateSubmissionId();

    // In production:
    // 1. Save to database
    // 2. Upload screenshot to S3 (if provided)
    // 3. Notify team via Slack/Email
    // 4. Send thank you email

    console.log('Feedback submission:', {
      feedbackId,
      email,
      rating,
      category
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for your feedback',
        feedbackId,
        data: {
          rating,
          submittedAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Feedback submission error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to submit feedback',
        message: error.message
      })
    };
  }
};

/**
 * Registration Form Handler
 * POST /submit/registration
 */
module.exports.submitRegistration = async (event) => {
  const headers = getCorsHeaders();

  try {
    const body = JSON.parse(event.body);
    const { firstName, lastName, email, phone, company, eventId } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'First name, last name, and email are required'
        })
      };
    }

    if (!isValidEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid email format'
        })
      };
    }

    const registrationId = generateSubmissionId();

    // In production:
    // 1. Save to database
    // 2. Send confirmation email with QR code
    // 3. Add to event management system
    // 4. Send calendar invite

    console.log('Registration submission:', {
      registrationId,
      email,
      eventId
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful',
        registrationId,
        data: {
          firstName,
          lastName,
          email,
          registeredAt: new Date().toISOString()
        }
      })
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to complete registration',
        message: error.message
      })
    };
  }
};

/**
 * Get Submissions Handler
 * GET /submissions
 */
module.exports.getSubmissions = async (event) => {
  const headers = getCorsHeaders();

  try {
    const { formType, startDate, endDate, page = 1, limit = 10 } = event.queryStringParameters || {};

    // In production:
    // 1. Query database with filters
    // 2. Implement pagination
    // 3. Add authorization check

    const mockSubmissions = [
      {
        id: 'sub_123',
        formType: 'contact',
        data: { name: 'John Doe', email: 'john@example.com' },
        submittedAt: '2025-01-15T10:30:00Z'
      },
      {
        id: 'sub_124',
        formType: 'newsletter',
        data: { email: 'jane@example.com' },
        submittedAt: '2025-01-15T11:00:00Z'
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: mockSubmissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockSubmissions.length
        }
      })
    };
  } catch (error) {
    console.error('Get submissions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to retrieve submissions',
        message: error.message
      })
    };
  }
};

/**
 * Validate Form Data Handler
 * POST /validate
 */
module.exports.validateForm = async (event) => {
  const headers = getCorsHeaders();

  try {
    const body = JSON.parse(event.body);
    const { formType, data } = body;

    let validation;

    switch (formType) {
      case 'contact':
        validation = validateContactForm(data);
        break;
      case 'newsletter':
        validation = { valid: isValidEmail(data.email), errors: [] };
        break;
      default:
        validation = { valid: false, errors: ['Unknown form type'] };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        valid: validation.valid,
        errors: validation.errors || []
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Validation failed',
        message: error.message
      })
    };
  }
};

// Helper Functions

function getCorsHeaders() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function validateContactForm({ name, email, subject, message }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!subject || subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters');
  }

  if (!message || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateSubmissionId() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `sub_${timestamp}_${random}`;
}

async function verifyRecaptcha(token) {
  // In production, verify with Google reCAPTCHA API
  // const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {...});
  console.log('Verifying reCAPTCHA token:', token);
  return true; // Mock verification
}

async function sendEmail({ to, subject, html }) {
  // In production, use SendGrid, SES, or other email service
  console.log('Sending email:', { to, subject });
  return true;
}
