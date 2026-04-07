# RBAC API Reference & Examples

## Complete API Endpoint Reference

### Authentication Endpoints

#### 1. Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Driver",
  "email": "john@example.com",
  "password": "securePass123",
  "role": "Driver"  // or "GarageHost" or "Admin"
}

Response (201 Created):
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c9001f5e5c7d",
    "name": "John Driver",
    "email": "john@example.com",
    "role": "Driver"
  }
}
```

#### 2. Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePass123"
}

Response (200 OK):
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c9001f5e5c7d",
    "name": "John Driver",
    "email": "john@example.com",
    "role": "Driver"
  }
}

Response (401 Unauthorized):
{
  "message": "Invalid credentials"
}
```

### Dashboard Endpoints

#### 3. Get Driver Dashboard
```http
GET /api/dashboard/driver
Authorization: Bearer {token}

Response (200 OK):
{
  "message": "Driver dashboard loaded",
  "data": {
    "totalBookings": 12,
    "activeBookings": 3,
    "totalSpent": 5400,
    "recentBookings": [...]
  }
}

Response (403 Forbidden - Account Suspended):
{
  "message": "Account suspended"
}

Response (403 Forbidden - Wrong Role):
{
  "message": "Unauthorized - invalid role"
}
```

#### 4. Get Admin Dashboard
```http
GET /api/dashboard/admin
Authorization: Bearer {admin_token}

Response (200 OK):
{
  "message": "Admin dashboard loaded",
  "data": {
    "totalUsers": 156,
    "totalGarages": 42,
    "totalTransactions": 3245,
    "totalRevenue": 2500000
  }
}

Response (403 Forbidden):
{
  "message": "Unauthorized - invalid role"
}
```

### Admin User Management Endpoints

#### 5. List All Users
```http
GET /api/admin/users
Authorization: Bearer {admin_token}

Response (200 OK):
[
  {
    "_id": "60d5ec49f1b2c9001f5e5c7d",
    "name": "John Driver",
    "email": "john@example.com",
    "phone": "+8801700000000",
    "role": "Driver",
    "status": "active",
    "createdAt": "2024-04-01T10:30:00Z"
  },
  {
    "_id": "60d5ec49f1b2c9001f5e5c7e",
    "name": "Jane Host",
    "email": "jane@example.com",
    "phone": "+8801700000001",
    "role": "GarageHost",
    "status": "suspended",
    "createdAt": "2024-03-15T14:20:00Z"
  },
  ...
]

Response (403 Forbidden):
{
  "message": "Unauthorized - invalid role"
}
```

#### 6. Suspend User
```http
PUT /api/admin/users/{user_id}/suspend
Authorization: Bearer {admin_token}
Content-Type: application/json

Response (200 OK):
{
  "message": "User suspended",
  "user": {
    "id": "60d5ec49f1b2c9001f5e5c7d",
    "status": "suspended"
  }
}

Response (400 Bad Request):
{
  "message": "Cannot suspend yourself"
}

Response (404 Not Found):
{
  "message": "User not found"
}

Response (403 Forbidden):
{
  "message": "Unauthorized - invalid role"
}
```

#### 7. Activate User
```http
PUT /api/admin/users/{user_id}/activate
Authorization: Bearer {admin_token}
Content-Type: application/json

Response (200 OK):
{
  "message": "User activated",
  "user": {
    "id": "60d5ec49f1b2c9001f5e5c7d",
    "status": "active"
  }
}

Response (404 Not Found):
{
  "message": "User not found"
}

Response (403 Forbidden):
{
  "message": "Unauthorized - invalid role"
}
```

#### 8. Change User Role
```http
PUT /api/admin/users/{user_id}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "GarageHost"  // Changed from "Driver"
}

Response (200 OK):
{
  "message": "User role updated",
  "user": {
    "id": "60d5ec49f1b2c9001f5e5c7d",
    "role": "GarageHost"
  }
}

Response (400 Bad Request):
{
  "message": "invalid role"
}
```

## cURL Command Examples

### Register as Driver
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali Ahmed",
    "email": "ali@example.com",
    "password": "Pass123Secure",
    "role": "Driver"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ali@example.com",
    "password": "Pass123Secure"
  }'
```

Save the returned token:
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Dashboard
```bash
curl -X GET http://localhost:5000/api/dashboard/driver \
  -H "Authorization: Bearer $TOKEN"
```

### List All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Suspend User (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/users/{user_id}/suspend \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Activate User (Admin Only)
```bash
curl -X PUT http://localhost:5000/api/admin/users/{user_id}/activate \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Postman Collection (JSON)

```json
{
  "info": {
    "name": "ParkDhaka RBAC API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"John Driver\",\n  \"email\": \"john@example.com\",\n  \"password\": \"Pass123\",\n  \"role\": \"Driver\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john@example.com\",\n  \"password\": \"Pass123\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Dashboards",
      "item": [
        {
          "name": "Driver Dashboard",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/dashboard/driver",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Admin Dashboard",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/dashboard/admin",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Admin User Management",
      "item": [
        {
          "name": "List Users",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/admin/users",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ]
          }
        },
        {
          "name": "Suspend User",
          "request": {
            "method": "PUT",
            "url": "{{base_url}}/api/admin/users/:user_id/suspend",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ]
          }
        },
        {
          "name": "Activate User",
          "request": {
            "method": "PUT",
            "url": "{{base_url}}/api/admin/users/:user_id/activate",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    },
    {
      "key": "admin_token",
      "value": ""
    }
  ]
}
```

## Error Response Reference

### 400 Bad Request
```json
{
  "message": "All fields are required"
}
```
**Cause**: Missing required fields in request body
**Solution**: Include all required fields: name, email, password, role

### 401 Unauthorized
```json
{
  "message": "Invalid token"
}
```
**Cause**: 
- Missing Authorization header
- Invalid JWT token
- Token expired
**Solution**: Include valid Bearer token in Authorization header

### 403 Forbidden - Suspended Account
```json
{
  "message": "Account suspended"
}
```
**Cause**: User account has been suspended by admin
**Solution**: Admin must activate the account

### 403 Forbidden - Wrong Role
```json
{
  "message": "Unauthorized - invalid role"
}
```
**Cause**: User's role doesn't match endpoint requirements
**Solution**: 
- Drivers can only access /api/dashboard/driver
- Admins can only access /api/admin/* endpoints
- GarageHosts can only access /garage-spaces endpoints

### 404 Not Found
```json
{
  "message": "User not found"
}
```
**Cause**: User ID provided doesn't exist
**Solution**: Verify user ID is correct

### 500 Internal Server Error
```json
{
  "message": "Database connection error"
}
```
**Cause**: Server-side error
**Solution**: Check server logs, ensure database is running

## Real-World Use Cases

### Use Case 1: Payment Fraud Prevention

```
Scenario: User makes suspicious payment pattern
Process:
  1. Fraud detection system flags account
  2. Admin receives alert
  3. Admin logs into dashboard
  4. Admin finds user in user list
  5. Admin suspends user immediately
  6. User's next API request gets 403
  7. User sees "Account suspended" message
  8. Support team investigates

Benefit: Fraud stopped in seconds, not hours
```

### Use Case 2: Terms of Service Violation

```
Scenario: User harasses other users
Process:
  1. Report received by moderation team
  2. Case reviewed by admin
  3. Violation confirmed
  4. Admin suspends user account
  5. User cannot access system until appeal
  6. Appeal process:
     - User contacts support
     - Support team reviews
     - If appeal approved, admin activates
     - If denied, remains suspended

Benefit: Quick enforcement of community standards
```

### Use Case 3: Account Compromise

```
Scenario: User reports account hacked
Process:
  1. User contacts support (through alternative channel)
  2. Support verifies identity
  3. Support tells admin to suspend account
  4. Admin suspends account
  5. Attacker cannot use account anymore
  6. User resets password
  7. Admin reactivates account
  8. Legitimate user can login again

Benefit: Prevents unauthorized access during recovery
```

### Use Case 4: Developer/Testing Access

```
Scenario: Grant dev access to test admin features
Process:
  1. Create test user: role="Driver"
  2. Test works as driver
  3. Admin changes role to "Admin"
  4. Dev can now access admin endpoints
  5. After testing, suspend account
  6. Account unavailable until reactivated

Benefit: Fine-grained control over test access
```

## Status Codes Reference

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Request successful |
| 201 | Created | Resource created (registration) |
| 400 | Bad Request | Invalid data in request |
| 401 | Unauthorized | No valid auth token |
| 403 | Forbidden | Account suspended OR insufficient role |
| 404 | Not Found | User not found |
| 500 | Server Error | Database or server issue |

## Token Structure

The JWT token is divided into 3 parts:

```
Header.Payload.Signature

Example:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiI2MGQ1ZWM0OWYxYjJjOTAwMWY1ZTVjN2QiLCJyb2xlIjoiRHJpdmVyIiwiaWF0IjoxNjExN...
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Decoded Payload:**
```json
{
  "userId": "60d5ec49f1b2c9001f5e5c7d",
  "role": "Driver",
  "iat": 1611111111,
  "exp": 1611716111
}
```

**Important**: 
- Token does NOT contain status field
- Status is ALWAYS checked from database
- Token expiration doesn't affect status check

## Testing Common Scenarios

### Test 1: Normal Login Flow
```bash
# 1. Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass","role":"Driver"}'

# 2. Login (get token)
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# 3. Use token (should work)
curl -X GET http://localhost:5000/api/dashboard/driver \
  -H "Authorization: Bearer {token}"
```

### Test 2: Suspension Flow
```bash
# 1. Admin suspends user
curl -X PUT http://localhost:5000/api/admin/users/{user_id}/suspend \
  -H "Authorization: Bearer {admin_token}"

# 2. User tries API call (should fail)
curl -X GET http://localhost:5000/api/dashboard/driver \
  -H "Authorization: Bearer {user_token}"
# Result: 403 "Account suspended"

# 3. Admin activates user
curl -X PUT http://localhost:5000/api/admin/users/{user_id}/activate \
  -H "Authorization: Bearer {admin_token}"

# 4. User tries again (should work)
curl -X GET http://localhost:5000/api/dashboard/driver \
  -H "Authorization: Bearer {user_token}"
# Result: 200 OK
```

### Test 3: Role-Based Access
```bash
# Driver tries to access admin endpoint (should fail)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer {driver_token}"
# Result: 403 "Unauthorized - invalid role"

# Admin accesses same endpoint (should work)
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer {admin_token}"
# Result: 200 OK + user list
```
