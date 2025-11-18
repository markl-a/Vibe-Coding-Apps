/**
 * Email Sender HTTP Cloud Function
 * 郵件發送服務（使用 SendGrid）
 */

const sgMail = require('@sendgrid/mail');

// 初始化 SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * 設定 CORS
 */
function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 驗證 email 格式
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 發送單封郵件
 */
async function sendSingleEmail(options) {
  try {
    const {
      from = process.env.FROM_EMAIL || 'noreply@example.com',
      to,
      subject,
      text,
      html,
      replyTo
    } = options;

    // 驗證
    if (!to || !isValidEmail(to)) {
      throw new Error('Invalid recipient email');
    }

    if (!subject) {
      throw new Error('Subject is required');
    }

    if (!text && !html) {
      throw new Error('Either text or html content is required');
    }

    // 構建郵件
    const msg = {
      from,
      to,
      subject,
      text,
      html: html || text,
      replyTo: replyTo || from
    };

    // 發送
    const result = await sgMail.send(msg);

    console.log('Email sent to:', to);

    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      to,
      subject
    };
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
}

/**
 * 批量發送郵件
 */
async function sendBatchEmails(emails) {
  try {
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          const result = await sendSingleEmail(email);
          return {
            success: true,
            to: email.to,
            result
          };
        } catch (error) {
          return {
            success: false,
            to: email.to,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: emails.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('Batch email error:', error);
    throw error;
  }
}

/**
 * 發送模板郵件
 */
async function sendTemplateEmail(options) {
  try {
    const {
      to,
      templateId,
      dynamicTemplateData,
      from = process.env.FROM_EMAIL || 'noreply@example.com'
    } = options;

    if (!templateId) {
      throw new Error('Template ID is required');
    }

    if (!to || !isValidEmail(to)) {
      throw new Error('Invalid recipient email');
    }

    const msg = {
      from,
      to,
      templateId,
      dynamicTemplateData: dynamicTemplateData || {}
    };

    const result = await sgMail.send(msg);

    console.log('Template email sent to:', to);

    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
      to,
      templateId
    };
  } catch (error) {
    console.error('Send template email error:', error);
    throw error;
  }
}

/**
 * 常用郵件模板
 */
const emailTemplates = {
  welcome: (name) => ({
    subject: '歡迎加入！',
    html: `
      <h1>歡迎，${name}！</h1>
      <p>感謝您加入我們的平台。我們很高興有您的加入！</p>
      <p>如果您有任何問題，請隨時聯繫我們。</p>
      <p>祝好，<br>團隊</p>
    `
  }),

  verification: (name, code) => ({
    subject: '驗證您的電子郵件',
    html: `
      <h1>驗證碼</h1>
      <p>親愛的 ${name}，</p>
      <p>您的驗證碼是：<strong style="font-size: 24px;">${code}</strong></p>
      <p>此驗證碼將在 10 分鐘後過期。</p>
    `
  }),

  passwordReset: (name, resetLink) => ({
    subject: '重置密碼請求',
    html: `
      <h1>重置密碼</h1>
      <p>親愛的 ${name}，</p>
      <p>我們收到了您的密碼重置請求。請點擊下方按鈕重置密碼：</p>
      <p><a href="${resetLink}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密碼</a></p>
      <p>如果您沒有請求重置密碼，請忽略此郵件。</p>
      <p>此鏈接將在 1 小時後過期。</p>
    `
  }),

  notification: (title, message) => ({
    subject: title,
    html: `
      <h1>${title}</h1>
      <p>${message}</p>
      <p>此為系統自動發送的通知郵件。</p>
    `
  })
};

/**
 * 主函數
 */
exports.emailSender = async (req, res) => {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // 檢查 SendGrid API Key
  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'SendGrid API key not configured'
    });
  }

  try {
    const {
      action = 'single',  // 'single', 'batch', 'template', 'quick'
      ...options
    } = req.body;

    console.log(`Email Sender - Action: ${action}`);

    let result;

    switch (action) {
      case 'batch':
        if (!options.emails || !Array.isArray(options.emails)) {
          return res.status(400).json({
            success: false,
            error: 'emails array is required for batch action'
          });
        }

        if (options.emails.length > 100) {
          return res.status(400).json({
            success: false,
            error: 'Maximum 100 emails per batch'
          });
        }

        result = await sendBatchEmails(options.emails);
        break;

      case 'template':
        result = await sendTemplateEmail(options);
        break;

      case 'quick':
        // 使用預設模板快速發送
        const { to, templateType, templateData } = options;

        if (!to || !templateType) {
          return res.status(400).json({
            success: false,
            error: 'to and templateType are required for quick action'
          });
        }

        if (!emailTemplates[templateType]) {
          return res.status(400).json({
            success: false,
            error: `Invalid template type. Available: ${Object.keys(emailTemplates).join(', ')}`
          });
        }

        const template = emailTemplates[templateType](...Object.values(templateData || {}));

        result = await sendSingleEmail({
          to,
          ...template,
          ...options
        });
        break;

      case 'single':
      default:
        result = await sendSingleEmail(options);
    }

    res.status(200).json({
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email Sender Error:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.code === 400 || error.code === 401 || error.code === 403) {
      statusCode = error.code;
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
};
