# Notification Service API

A comprehensive notification service with support for push notifications (FCM), email notifications (SendGrid), and user preference management.

## Features

- **Push Notifications**: Send notifications via Firebase Cloud Messaging (FCM)
- **Email Notifications**: Send emails via SendGrid
- **User Preferences**: Manage notification preferences per user
- **Quiet Hours**: Respect user-defined quiet hours
- **Device Management**: Register and manage multiple devices per user
- **Scheduled Notifications**: Schedule notifications for future delivery
- **Retry Logic**: Automatic retry for failed notifications
- **Topic Subscriptions**: Group notifications by topics

## Installation

```bash
cd apis-backend/rest-api/notification-service
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `SENDGRID_API_KEY`: SendGrid API key for email notifications
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`: Firebase credentials for push notifications

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The notification service includes **98 comprehensive test cases** covering:

### 1. Notification Model Tests (15 tests)
- Notification creation and validation
- Status management (pending, sent, delivered, read, failed)
- Priority levels (low, normal, high, urgent)
- Scheduled notifications
- Data and metadata storage

### 2. Notification Preference Tests (22 tests)
- User preference creation with defaults
- Quiet hours configuration and validation
- Notification type preferences (push, email, SMS, in-app)
- Category-specific preferences
- Device management (add, remove, update devices)
- Email frequency settings

### 3. Push Notification Service Tests (15 tests)
- Firebase Admin SDK initialization
- Send to single device
- Send to multiple devices
- Topic-based messaging
- Subscribe/unsubscribe from topics
- Priority mapping
- Error handling for invalid tokens

### 4. Email Notification Service Tests (18 tests)
- SendGrid initialization
- Send single email
- Send bulk emails
- Template-based emails
- Emails with attachments
- HTML email template generation
- HTML to text conversion
- Error handling

### 5. Notification Service Integration Tests (28 tests)
- End-to-end notification creation and sending
- User preference integration
- Quiet hours enforcement
- Disabled notification type blocking
- Multi-device notifications
- Scheduled notification processing
- Failed notification retry logic
- Notification querying and filtering
- Mark as read functionality
- Unread count tracking

## Test Structure

```
src/__tests__/
├── notification.test.js              # 15 tests - Notification model
├── notificationPreference.test.js    # 22 tests - User preferences
├── pushNotificationService.test.js   # 15 tests - FCM integration
├── emailNotificationService.test.js  # 18 tests - Email integration
└── notificationService.test.js       # 28 tests - Core service logic
```

## Mocking Strategy

The tests use comprehensive mocking to isolate external dependencies:

- **Firebase Admin SDK**: Mocked to test push notification logic without actual FCM calls
- **SendGrid**: Mocked to test email logic without sending real emails
- **MongoDB**: Uses a test database that's cleaned between tests

## Running Individual Test Suites

```bash
# Run only notification model tests
npm test -- notification.test.js

# Run only preference tests
npm test -- notificationPreference.test.js

# Run only service tests
npm test -- notificationService.test.js
```

## API Endpoints (To Be Implemented)

- `POST /api/notifications` - Create a notification
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/:id` - Get specific notification
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread/count` - Get unread count
- `POST /api/preferences` - Update notification preferences
- `GET /api/preferences` - Get user preferences
- `POST /api/devices` - Register device token
- `DELETE /api/devices/:token` - Remove device token

## Development

```bash
# Start development server
npm run dev

# Start production server
npm start
```

## License

MIT
