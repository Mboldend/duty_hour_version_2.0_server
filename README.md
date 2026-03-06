# HRM (Human Resource Management) System

A comprehensive backend API for managing human resources, employee attendance, shifts, payroll, leave management, and subscription-based features. Built with TypeScript, Node.js, Express, and MongoDB with integrated Stripe payment processing and real-time Socket.io support.

## Features

### Core Management
- **Employee Management:** Complete employee lifecycle management with personal and professional details
- **Attendance Tracking:** Track employee attendance with check-in/check-out functionality
- **Shift Management:** Create and manage work shifts with employee assignments
- **Leave Management:** Comprehensive leave request and approval system
- **Department & Designation:** Organize employees by departments and job roles
- **Holiday Calendar:** Manage company holidays and special days

### Financial Features
- **Payroll Management:** Calculate salaries with earnings and deductions
- **Subscription Plans:** Multi-tier subscription packages for different business sizes
- **Stripe Integration:** Secure payment processing with Stripe webhooks
- **Invoice Generation:** Automated invoice creation and tracking
- **Payment Tracking:** Track transaction IDs and payment status

### Advanced Features
- **Analytics Dashboard:** Real-time analytics on employee metrics and attendance
- **User Notifications:** Email and in-app notifications for important events
- **Real-time Updates:** Socket.io integration for live data synchronization
- **File Management:** Upload and manage documents (images, logos, files)
- **Role-Based Access Control:** Multi-level user roles (Admin, Business Owner, Employee)
- **Authentication:** JWT-based authentication with refresh token support
- **Audit Logging:** Winston-based logging for all operations

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-time:** Socket.io

### Security & Authentication
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcrypt
- **Data Validation:** Zod schemas
- **Error Handling:** Custom error handlers

### Payment Processing
- **Stripe API:** Payment processing and subscription management
- **Webhook Management:** Stripe event handlers

### File Handling & Email
- **File Upload:** Multer
- **Email Service:** NodeMailer
- **Email Templates:** HTML-based email templates

### Development & Logging
- **Code Quality:** ESLint & Prettier
- **Logging:** Winston with DailyRotateFile rotation
- **Request Logging:** Morgan
- **Load Testing:** YAML-based load test configuration

## Project Structure

```
src/
├── app/modules/          # Feature modules
│   ├── analytics/        # Analytics dashboard
│   ├── assignShift/      # Shift assignments
│   ├── attendance/       # Attendance tracking
│   ├── auth/             # Authentication
│   ├── employee/         # Employee management
│   ├── subscription/     # Subscription management
│   └── [other modules]/  # Additional features
├── config/               # Configuration files
├── DB/                   # Database seeders
├── enums/                # TypeScript enums
├── errors/               # Custom error classes
├── helpers/              # Helper utilities
│   └── stripe/           # Stripe webhook handlers
├── middlewares/          # Express middlewares
├── shared/               # Shared utilities
├── types/                # TypeScript type definitions
└── util/                 # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)
- Stripe account (for payment features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/hrm-system.git
   cd hrm-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**

   Copy `example.env` and configure:
   ```bash
   cp example.env .env
   ```

   Update the following variables:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   IP_ADDRESS=0.0.0.0

   # Database
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/hrm_db

   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE_IN=7d

   # Bcrypt
   BCRYPT_SALT_ROUNDS=12

   # Email Configuration (Gmail/SMTP)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=noreply@company.com

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK=https://app.example.com/dashboard
   BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed=https://app.example.com/pricing

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Setup Database (Optional - Seed Admin):**
   ```bash
   npm run seed:admin
   ```

5. **Start the server:**

   Development mode:
   ```bash
   npm run dev
   ```

   Production build:
   ```bash
   npm run build
   npm start
   ```

### Running with Docker

```bash
docker-compose up -d
```

## API Modules

### Authentication (`/api/v1/auth`)
- POST `/register` - Register new user
- POST `/login` - User login
- POST `/refresh-token` - Refresh JWT token
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password with token

### Employees (`/api/v1/employees`)
- GET `/` - List all employees
- POST `/` - Create new employee
- GET `/:id` - Get employee details
- PATCH `/:id` - Update employee
- DELETE `/:id` - Delete employee

### Attendance (`/api/v1/attendance`)
- POST `/check-in` - Record check-in
- POST `/check-out` - Record check-out
- GET `/` - Get attendance records
- GET `/report` - Generate attendance report

### Leaves (`/api/v1/leaves`)
- POST `/request` - Submit leave request
- GET `/` - Get leave requests
- PATCH `/:id/approve` - Approve leave
- PATCH `/:id/reject` - Reject leave

### Shifts (`/api/v1/shifts`)
- GET `/` - List all shifts
- POST `/` - Create shift
- PATCH `/:id/assign` - Assign employee to shift

### Subscriptions (`/api/v1/subscriptions`)
- POST `/checkout` - Create payment session
- GET `/details` - Get subscription details
- POST `/cancel` - Cancel subscription
- GET `/billing-portal` - Access billing portal

### Payroll (`/api/v1/payroll`)
- GET `/salary-slip/:id` - Get salary slip
- POST `/process` - Process monthly payroll

### Analytics (`/api/v1/analytics`)
- GET `/dashboard` - Dashboard metrics
- GET `/attendance-report` - Attendance analytics
- GET `/payroll-summary` - Payroll overview

## Real-time Features (Socket.io)

Connected to real-time notifications:
- Employee online/offline status
- Attendance updates
- Leave request notifications
- Shift announcements
- System notifications

Connect WebSocket:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

## Development

### Code Quality
```bash
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run lint:fix   # Fix linting errors
```

### Database Migrations
```bash
npm run db:seed    # Seed database
```

### Load Testing
```bash
npm run load-test  # Run load test (from test/loadTest.yaml)
```

## Project Statistics

- **Modules:** 15+ feature modules
- **Endpoints:** 50+ API endpoints
- **Database Collections:** 20+
- **Models:** TypeScript-first design

## Error Handling

Centralized error handling with custom error classes:
- `ApiError` - Application errors
- `ValidationError` - Zod validation errors
- `ZodError` - Schema validation errors

All errors are logged and return standardized JSON responses.

## Security Features

- ✅ JWT authentication with token refresh
- ✅ Password hashing with bcrypt
- ✅ Request validation with Zod
- ✅ Role-based access control (RBAC)
- ✅ File upload validation
- ✅ Stripe webhook signature verification
- ✅ Environment variable protection

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## Support

For support, email support@company.com or create an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
