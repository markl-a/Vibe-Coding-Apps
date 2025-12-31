# Enterprise Applications

A comprehensive collection of enterprise-grade applications built with modern technologies and AI-assisted development practices. This repository contains 34+ production-ready applications across 8 major business categories, designed to meet the diverse needs of modern enterprises.

## Overview

This directory contains a complete suite of enterprise applications, from HR management to business intelligence, all built with scalability, security, and maintainability in mind. Each application is designed to work independently or as part of an integrated enterprise ecosystem.

## Application Categories

### 1. HR Management (`hr-management/`)

Complete human resources management solutions for employee lifecycle management.

- **[Employee Directory](hr-management/employee-directory/)** - Full-featured employee information management system with org chart visualization
- **[Attendance Tracker](hr-management/attendance-tracker/)** - GPS-enabled attendance tracking with anomaly detection
- **[Payroll Calculator](hr-management/payroll-calculator/)** - Comprehensive payroll processing with tax calculations and payslip generation
- **[Leave Management](hr-management/leave-management/)** - Multi-type leave request and approval workflow system

**Key Features:** CRUD operations, department management, advanced search, role-based access control, automated calculations

### 2. CRM Systems (`crm-systems/`)

Customer relationship management tools for sales and customer service teams.

- **[Simple CRM](crm-systems/simple-crm/)** - Lightweight CRM with customer management, contacts, and opportunity tracking
- **[Customer Portal](crm-systems/customer-portal/)** - Self-service portal for customers
- **[Lead Management](crm-systems/lead-management/)** - Lead capture and nurturing system
- **[Sales Pipeline](crm-systems/sales-pipeline/)** - Visual sales pipeline management

**Key Features:** Customer data management, sales funnel tracking, activity logging, contact management, reporting

### 3. ERP Systems (`erp-systems/`)

Integrated enterprise resource planning modules for business operations.

- **[Financial Accounting](erp-systems/financial-accounting/)** - Core accounting and general ledger system
- **[Inventory Management](erp-systems/inventory-management/)** - Stock tracking and warehouse management
- **[Purchase Order System](erp-systems/purchase-order-system/)** - Procurement and supplier management
- **[Sales Order System](erp-systems/sales-order-system/)** - Order processing and fulfillment

**Key Features:** Integrated business processes, real-time inventory, automated workflows, financial controls

### 4. Finance & Accounting (`finance-accounting/`)

Financial management and accounting tools for business finance operations.

- **[Budget Planner](finance-accounting/budget-planner/)** - Budget creation and monitoring
- **[Expense Tracker](finance-accounting/expense-tracker/)** - Employee expense management and reimbursement
- **[Financial Dashboard](finance-accounting/financial-dashboard/)** - Real-time financial KPIs and reporting
- **[Invoice Generator](finance-accounting/invoice-generator/)** - Automated invoice creation and management
- **[Receipt OCR](finance-accounting/receipt-ocr/)** - AI-powered receipt scanning and data extraction

**Key Features:** Financial reporting, budget controls, invoice management, expense tracking, OCR technology

### 5. Project Management (`project-management/`)

Tools for agile and traditional project management methodologies.

- **[Kanban Board](project-management/kanban-board/)** - Visual task management with drag-and-drop interface
- **[Gantt Chart](project-management/gantt-chart/)** - Timeline-based project planning
- **[Project Dashboard](project-management/project-dashboard/)** - Project overview and status monitoring
- **[Resource Allocator](project-management/resource-allocator/)** - Team capacity and resource planning
- **[Sprint Manager](project-management/sprint-manager/)** - Agile sprint planning and tracking
- **[AI Assistant](project-management/ai-assistant/)** - AI-powered project insights and recommendations

**Key Features:** Task tracking, team collaboration, time estimation, progress visualization, agile workflows

### 6. Collaboration Tools (`collaboration-tools/`)

Enterprise communication and collaboration platforms.

- **[Team Chat](collaboration-tools/team-chat/)** - Real-time messaging and team communication
- **[Video Conference](collaboration-tools/video-conference/)** - Web-based video conferencing solution
- **[Knowledge Base](collaboration-tools/knowledge-base/)** - Internal wiki and documentation system
- **[Realtime Docs](collaboration-tools/realtime-docs/)** - Collaborative document editing

**Key Features:** Real-time communication, document collaboration, knowledge sharing, team coordination

### 7. Business Intelligence (`business-intelligence/`)

Data analytics and reporting tools for data-driven decision making.

- **[Interactive Dashboard](business-intelligence/interactive-dashboard/)** - Plotly Dash-based interactive data visualization
- **[Predictive Analytics](business-intelligence/predictive-analytics/)** - ML-powered forecasting and predictions
- **[Sales Analytics](business-intelligence/sales-analytics/)** - Sales performance analysis and insights
- **[AI Insights Engine](business-intelligence/ai-insights-engine/)** - Automated insights generation
- **[ETL Pipeline](business-intelligence/etl-pipeline/)** - Data extraction, transformation, and loading
- **[KPI Monitoring](business-intelligence/kpi-monitoring/)** - Key performance indicator tracking
- **[NLQ Interface](business-intelligence/nlq-interface/)** - Natural language query interface

**Key Features:** Data visualization, predictive analytics, real-time dashboards, automated reporting, ML integration

### 8. Supply Chain (`supply-chain/`)

Supply chain optimization and logistics management.

- **[Demand Forecasting](supply-chain/demand-forecasting/)** - ML-based demand prediction
- **[Inventory Optimization](supply-chain/inventory-optimization/)** - Smart inventory level management
- **[Route Optimization](supply-chain/route-optimization/)** - Delivery route planning
- **[Supplier Performance](supply-chain/supplier-performance/)** - Vendor performance tracking

**Key Features:** Demand prediction, logistics optimization, supplier management, inventory control

## Common Features Across Applications

### Security & Authentication
- JWT-based authentication and authorization
- Role-Based Access Control (RBAC)
- Secure password hashing (bcrypt)
- Session management
- API key authentication
- CORS configuration

### Data Management
- RESTful API architecture
- CRUD operations with validation
- Database transactions
- Data migration support
- Backup and restore capabilities
- CSV/Excel import/export

### User Experience
- Responsive design (mobile-friendly)
- Real-time updates
- Advanced search and filtering
- Pagination and infinite scroll
- Dark/light theme support
- Internationalization (i18n) ready

### Monitoring & Logging
- Application logging
- Error tracking
- Performance monitoring
- Audit trails
- Activity history

### Integration Capabilities
- Webhook support
- Third-party API integration
- Email notifications
- Calendar integration
- Cloud storage integration

## Technology Stack

### Backend Technologies

#### Node.js Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL, SQLite
- **Authentication:** JWT (jsonwebtoken), bcrypt
- **Validation:** Zod, express-validator

#### Python Stack
- **Runtime:** Python 3.8+
- **Frameworks:** Flask, FastAPI, Dash
- **Data Processing:** Pandas, NumPy
- **Visualization:** Plotly, Matplotlib
- **Database:** SQLAlchemy ORM
- **ML/AI:** scikit-learn, TensorFlow

### Frontend Technologies

- **Framework:** React 18+ with TypeScript
- **UI Library:** Ant Design
- **State Management:** React Query, Context API
- **Routing:** React Router v6
- **Forms:** React Hook Form, Formik
- **Charts:** Recharts, Chart.js
- **Date/Time:** dayjs, date-fns
- **Build Tool:** Vite
- **Styling:** CSS Modules, Tailwind CSS (selected apps)

### Databases

- **PostgreSQL** - Primary relational database for most applications
- **SQLite** - Lightweight database for simple applications and development
- **MongoDB** - Document database for specific use cases
- **Redis** - Caching and session storage

### Development Tools

- **Package Managers:** npm, yarn, pip
- **Version Control:** Git
- **Code Quality:** ESLint, Prettier, Black (Python)
- **Testing:** Jest, Supertest, pytest
- **API Testing:** Postman, Thunder Client
- **Documentation:** Swagger/OpenAPI

### DevOps & Deployment

- **Containerization:** Docker, Docker Compose
- **Process Management:** PM2 (Node.js)
- **Web Servers:** Nginx, Apache
- **CI/CD:** GitHub Actions, GitLab CI
- **Cloud Platforms:** AWS, Azure, Google Cloud, Heroku
- **Monitoring:** Application logs, Performance metrics

## Getting Started

### Prerequisites

Before running any application, ensure you have the following installed:

**For Node.js Applications:**
- Node.js 18+ and npm
- PostgreSQL 14+ (for production apps) or SQLite (for development)
- Git

**For Python Applications:**
- Python 3.8+
- pip
- Virtual environment (venv or conda)

### Quick Start Guide

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd enterprise-apps
```

#### 2. Choose an Application

Navigate to the desired application category and project:

```bash
# Example: HR Management - Employee Directory
cd hr-management/employee-directory
```

#### 3. Setup Backend (Node.js Example)

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file with your database credentials

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

The backend will typically run on `http://localhost:3000` (or the port specified in .env)

#### 4. Setup Frontend (React Example)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables (if needed)
cp .env.example .env

# Start development server
npm run dev
```

The frontend will typically run on `http://localhost:5173` (Vite default)

#### 5. Setup Python Applications

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
# or for Streamlit apps:
streamlit run app.py
```

### Environment Configuration

Most applications require environment variables for configuration. Common variables include:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Server
PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (if applicable)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Architecture Overview

### Application Architecture

Most applications in this repository follow a **three-tier architecture**:

```
┌─────────────────────────────────────────┐
│         Frontend (React + TS)            │
│  - UI Components (Ant Design)           │
│  - State Management (React Query)       │
│  - Routing (React Router)               │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST API
┌─────────────────▼───────────────────────┐
│      Backend (Node.js/Python)           │
│  - API Routes & Controllers             │
│  - Business Logic                       │
│  - Authentication & Authorization       │
│  - Data Validation                      │
└─────────────────┬───────────────────────┘
                  │ ORM/Query
┌─────────────────▼───────────────────────┐
│       Database (PostgreSQL/SQLite)      │
│  - Data Models & Relations              │
│  - Migrations                           │
│  - Indexes & Constraints                │
└─────────────────────────────────────────┘
```

### Backend Architecture Pattern

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models (Prisma/SQLAlchemy)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, validation, error handling
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   └── types/           # TypeScript type definitions
├── prisma/              # Database schema & migrations
├── tests/               # Unit and integration tests
└── package.json         # Dependencies
```

### Frontend Architecture Pattern

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API calls
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React contexts
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript interfaces
│   ├── styles/          # Global styles
│   └── App.tsx          # Main application component
├── public/              # Static assets
└── package.json         # Dependencies
```

### API Design Principles

All applications follow RESTful API conventions:

- **GET** `/api/resource` - List all resources
- **GET** `/api/resource/:id` - Get single resource
- **POST** `/api/resource` - Create new resource
- **PUT** `/api/resource/:id` - Update entire resource
- **PATCH** `/api/resource/:id` - Partial update
- **DELETE** `/api/resource/:id` - Delete resource

Standard response format:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2025-12-31T00:00:00Z"
}
```

Error response format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
```

## Development Best Practices

### Code Quality
- Use TypeScript for type safety
- Follow consistent coding style (ESLint, Prettier)
- Write self-documenting code with clear naming
- Keep functions small and focused (Single Responsibility)
- Use meaningful commit messages

### Security
- Never commit secrets or credentials
- Use environment variables for configuration
- Implement proper input validation and sanitization
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on API endpoints
- Keep dependencies updated

### Testing
- Write unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Aim for >70% code coverage
- Test error scenarios and edge cases

### Performance
- Implement database indexes for frequently queried fields
- Use connection pooling for database connections
- Cache frequently accessed data (Redis)
- Implement pagination for large datasets
- Optimize database queries (avoid N+1 queries)
- Use lazy loading for frontend components

### Documentation
- README file for each application
- API documentation (Swagger/OpenAPI)
- Code comments for complex logic
- Database schema documentation
- Deployment instructions

## Deployment

### Docker Deployment

Most applications include Docker support. To deploy using Docker:

```bash
# Navigate to application directory
cd hr-management/employee-directory

# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Production Deployment

#### Backend (Node.js)

```bash
# Build the application
npm run build

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name app-name

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Frontend (React)

```bash
# Build for production
npm run build

# The build output will be in the 'dist' or 'build' directory
# Serve with nginx or any static file server
```

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/app/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Cloud Platform Deployment

#### Heroku

```bash
# Login to Heroku
heroku login

# Create application
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

#### AWS / Azure / Google Cloud

Refer to individual application READMEs for specific deployment instructions.

## Testing

### Running Tests

#### Node.js Applications

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Python Applications

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_api.py
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs** - Open an issue with details about the bug
2. **Suggest Features** - Open an issue with your feature request
3. **Submit Pull Requests** - Fork the repo and submit a PR

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure they pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL in .env file
- Ensure PostgreSQL is running
- Check database credentials

**Port Already in Use**
- Change PORT in .env file
- Kill the process using the port: `lsof -ti:3000 | xargs kill`

**Prisma Client Not Generated**
- Run `npx prisma generate`
- Delete node_modules and reinstall

**CORS Errors**
- Update CORS_ORIGIN in backend .env
- Ensure frontend URL matches CORS configuration

## Support and Resources

### Documentation
- Each application has its own detailed README
- API documentation available via Swagger (where implemented)
- Database schema documented in Prisma schema files

### Learning Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Reference Projects
- Odoo - Open Source ERP
- ERPNext - Open Source ERP
- SuiteCRM - Open Source CRM
- Metabase - Open Source BI

## License

MIT License - See individual project LICENSE files for details.

## Acknowledgments

These applications were built using modern best practices and draw inspiration from industry-leading enterprise software solutions. Special thanks to the open-source community for the excellent tools and frameworks that made this possible.

---

**Note:** This is an active development repository. Applications are in various stages of completion. Please refer to individual project READMEs for specific status and feature completeness.
