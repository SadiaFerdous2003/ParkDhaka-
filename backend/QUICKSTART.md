# Quick Start Guide - Testing the Implementation

## Prerequisites
- Node.js installed
- MongoDB connection string ready (or local MongoDB)
- Port 5000 available

## 1. Install Dependencies
```bash
cd backend
npm install
```

## 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and update:
```ini
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
OTP_EXPIRE_MINUTES=5    # 5 minutes for testing
```

Optional (for real email/SMS):
```ini
# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@parkdhaka.com

# Twilio SMS
TWILIO_SID=your-sid
TWILIO_TOKEN=your-token
TWILIO_FROM=+1234567890
```

## 3. Start the Server
```bash
npm run dev
```

Expected output:
```
[overstayManager] starting overstay checker
Server running on port 5000
MongoDB Connected
```

## 4. Run Tests (in another terminal)

### Test OTP Feature
```bash
cd backend
node test-otp.js
```

Expected output:
```
✓ OTP generated and sent
✓ OTP verification: {"valid":true}
✓ All OTP tests passed!
```

### Test Admin/Roles
```bash
node test-admin-auth.js
```

Expected output:
```
✓ Created users
✓ Admin role validated
✓ All role-based access control tests passed!
```

### Test Full API Integration
```bash
node test-api-integration.js
```

Expected output:
```
✓ Request OTP for registration
✓ Verify OTP and register user
✓ Admin can suspend user
✓ Suspended user cannot access API
✓ All API tests passed!
```

## 5. Manual API Testing

### Request OTP
```bash
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "test@example.com",
    "purpose": "register"
  }'
```

### Get OTP Code (from DB for testing)
The test files show how to retrieve the generated OTP code from the database.
In production, users would receive it via email/SMS.

### Register with OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "test@example.com",
    "code": "123456",
    "purpose": "register",
    "name": "John Doe",
    "email": "test@example.com",
    "password": "secure123",
    "role": "Driver"
  }'
```

Response:
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "test@example.com",
    "role": "Driver"
  }
}
```

### Test Overstay Management
Creates a booking and checks for overstays:
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "garageSpaceId": "<space-id>",
    "date": "2026-04-07",
    "startTime": "10:00",
    "duration": "hourly"
  }'
```

The overstay checker runs automatically every 60 seconds.
Check for overstay by looking at the booking:
```bash
curl -X GET http://localhost:5000/api/bookings/my \
  -H "Authorization: Bearer <token>"
```

Overstayed booking will have:
```json
{
  "isOverstayed": true,
  "overstayDuration": 45,        // minutes
  "overstayFine": 75,            // ৳
  "paymentStatus": "pending"
}
```

## Feature Summary

### 1. OTP Authentication ✓
- Request OTP: `POST /api/auth/request-otp`
- Verify & Register: `POST /api/auth/verify-otp?purpose=register`
- Verify & Login: `POST /api/auth/verify-otp?purpose=login`

### 2. Overstay Fines ✓
- Automatic detection every 60 seconds
- Fine = (hourly_rate / 60) × minutes × 1.5
- Stored in booking: `isOverstayed`, `overstayFine`, `paymentStatus`
- Pay fine: `PUT /api/bookings/:id/pay-fine`

### 3. Role-Based Access ✓
- Admin endpoints:
  - `GET /api/admin/users` — List all users
  - `PUT /api/admin/users/:id/suspend` — Suspend user
  - `PUT /api/admin/users/:id/activate` — Activate user
  - `PUT /api/admin/users/:id/role` — Change role

## Troubleshooting

### Port 5000 already in use
```bash
taskkill /IM node.exe /F
```

### MongoDB connection fails
- Verify `MONGO_URI` in `.env`
- Ensure MongoDB is running or Atlas cluster is accessible
- Check credentials (username/password)

### OTP not sending
- By default, OTP is logged to console (no SMTP configured)
- To enable real email: Configure `SMTP_*` variables in `.env`
- To enable SMS: Configure `TWILIO_*` variables in `.env`

### Tests fail with "Cannot find module"
```bash
npm install
```

### Auth middleware error
- Wait a few seconds for server to connect to MongoDB
- Check `MONGO_URI` is correct

## Next Steps

1. **Frontend Integration:** Connect React/Vue forms to OTP endpoints
2. **Payment Gateway:** Integrate Stripe/Paypal for overstay fine payment
3. **Email Templates:** Create HTML email templates for OTP/notifications
4. **Rate Limiting:** Add rate limiter for OTP requests (e.g., max 3/hour)
5. **Audit Logging:** Log all admin actions (suspend, activate, role change)

## Documentation

- **FEATURES.md** — Detailed feature documentation
- **IMPLEMENTATION_SUMMARY.md** — Complete implementation guide
- **IMPLEMENTATION_CHECKLIST.md** — Full checklist with requirements

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for API examples
2. Review test files for usage patterns
3. Check `.env.example` for all available configurations
