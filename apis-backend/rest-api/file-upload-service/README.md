# File Upload Service

A professional, production-ready file upload service with support for multiple cloud storage providers (AWS S3, Google Cloud Storage, MinIO, and local storage).

## Features

- Multiple cloud storage provider support (S3, GCS, MinIO, Local)
- File validation (size, type, extension, dimensions)
- Multiple file upload support
- File metadata retrieval
- Comprehensive file management (upload, download, delete, list)
- Rate limiting and security features
- RESTful API design
- Extensive test coverage (unit, integration, E2E)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure your settings:

```env
# Server
PORT=3000
NODE_ENV=development

# Storage Provider (s3, gcs, minio, local)
STORAGE_PROVIDER=s3
STORAGE_BUCKET=uploads

# AWS S3 (if using S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Google Cloud Storage (if using GCS)
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE=path/to/keyfile.json

# MinIO (if using MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

## Usage

### Start the server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

### API Endpoints

#### Upload Single File
```bash
POST /api/upload
Content-Type: multipart/form-data

file: [binary data]
folder: "images" (optional)
prefix: "avatar" (optional)
```

#### Upload Multiple Files
```bash
POST /api/upload/multiple
Content-Type: multipart/form-data

files: [binary data array]
folder: "documents" (optional)
```

#### Download File
```bash
GET /api/files/:fileKey
```

#### Delete File
```bash
DELETE /api/files/:fileKey
```

#### List Files
```bash
GET /api/files?prefix=folder/
```

#### Get File Metadata
```bash
GET /api/metadata/:fileKey
```

#### Health Check
```bash
GET /api/health
```

## Testing

The service includes comprehensive test coverage:

### Test Structure

```
src/__tests__/
├── unit/                      # Unit tests
│   ├── validation.service.test.js
│   ├── storage.service.test.js
│   └── upload.controller.test.js
├── integration/               # Integration tests
│   └── upload.integration.test.js
├── e2e/                      # End-to-end tests
│   └── file-lifecycle.test.js
├── helpers/                  # Test utilities
│   └── test-utils.js
└── setup.js                  # Test setup configuration
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

The test suite includes:

#### Unit Tests (40+ test cases)
- **ValidationService Tests (25 tests)**
  - File size validation
  - File type validation
  - File extension validation
  - Filename validation
  - Filename sanitization
  - Image dimension validation
  - File category detection

- **StorageService Tests (25+ tests)**
  - S3 operations (upload, download, delete, list, metadata)
  - MinIO operations (upload, download, delete, list, metadata)
  - GCS operations (upload, download, delete, list, metadata)
  - Local storage operations
  - Provider routing
  - File naming generation

- **UploadController Tests (15+ tests)**
  - Single file upload
  - Multiple file upload
  - File download
  - File deletion
  - File listing
  - Metadata retrieval
  - Error handling

#### Integration Tests (20+ test cases)
- API endpoint testing
- Request/response validation
- Error handling
- CORS configuration
- Rate limiting
- File upload workflows
- Batch operations

#### E2E Tests (15+ test cases)
- Complete file lifecycle (upload → download → delete)
- Multiple file operations
- Concurrent uploads/downloads
- File organization in folders
- Error recovery scenarios
- Service health monitoring

### Test Statistics

- **Total Test Files**: 6
- **Total Test Cases**: 75+
- **Coverage Target**: 80%+
- **Test Types**: Unit, Integration, E2E

### Mock Implementations

All cloud storage providers are mocked in tests to ensure:
- Fast test execution
- No external dependencies
- Consistent test results
- Cost-effective testing

### Running Specific Tests

```bash
# Run a specific test file
npm test -- validation.service.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="upload"

# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage report
npm test -- --coverage --coverageReporters=text-summary
```

### Coverage Reports

After running tests with coverage, view the HTML report:

```bash
open coverage/lcov-report/index.html
```

## Development

### Project Structure

```
file-upload-service/
├── src/
│   ├── __tests__/           # Test files
│   ├── config/              # Configuration files
│   │   └── storage.js
│   ├── controllers/         # Route controllers
│   │   └── upload.controller.js
│   ├── middleware/          # Express middleware
│   │   └── upload.middleware.js
│   ├── routes/              # API routes
│   │   └── upload.routes.js
│   ├── services/            # Business logic
│   │   ├── storage.service.js
│   │   └── validation.service.js
│   └── index.js            # Application entry point
├── .env.example            # Environment variables template
├── jest.config.js          # Jest configuration
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Adding New Storage Providers

1. Add provider configuration in `src/config/storage.js`
2. Implement provider methods in `src/services/storage.service.js`
3. Add tests for the new provider
4. Update documentation

### Code Quality

- ESLint configuration for code linting
- Jest for testing
- Comprehensive error handling
- Input validation
- Security best practices

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- File type validation
- File size limits
- Filename sanitization

## Performance

- In-memory buffering with Multer
- Streaming downloads
- Efficient file operations
- Connection pooling for cloud providers

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
