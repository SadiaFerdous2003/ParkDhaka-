# Quick Start Guide - Testing RBAC System

## Prerequisites

1. Backend running: `npm start` (or `npm run dev`)
2. Frontend accessible at http://localhost:3000

## Test Users (Already Created)

These users exist in the database from running the test:

| Email | Password | Role |
|-------|----------|------|
| driver-demo@test.com | driverpass123 | Driver |
| admin-demo@test.com | adminpass123 | Admin |
| host-demo@test.com | hostpass123 | GarageHost |

## Demo Scenario 1: Suspend & Block User

### Step 1: Login as Admin
1. Open http://localhost:3000/index.html
2. Click "Login" tab
3. Email: `admin-demo@test.com`
4. Password: `adminpass123`
5. Click "Login"

### Step 2: View Admin Dashboard
- You'll see admin dashboard with stats
- Below that is "👥 User Management" section
- A table shows all users with their status

### Step 3: Find and Suspend Driver
1. Look for "John Driver" (driver-demo@test.com) in the user list
2. Current status should be: ✅ Active
3. Click the red "Suspend" button
4. Confirm: "Are you sure you want to suspend this user?"
5. User will now show: 🚫 Suspended with "Activate" button

### Step 4: Test Suspended User Login
1. Click "Logout" button
2. Click "Login" tab
3. Email: `driver-demo@test.com`
4. Password: `driverpass123`
5. Click "Login"

**Result**: Error message should appear:
- "Account suspended" OR
- "Access denied" OR  
- Error page showing the account is blocked

### Step 5: Reactivate and Login Again
1. Click "Logout" (or go back)
2. Login as admin again with: admin-demo@test.com / adminpass123
3. Find "John Driver" in user list
4. Click green "Activate" button
5. Confirm the action

### Step 6: Login with Reactivated User
1. Logout from admin
2. Login as driver again: driver-demo@test.com / driverpass123
3. **Success!** Dashboard now loads and shows booking options

## Demo Scenario 2: View Admin Capabilities

### Step 1: Login as Driver
1. Login with: driver-demo@test.com / driverpass123
2. See **Driver Dashboard** - shows bookings only
3. Navigation options available:
   - View Garages
   - My Bookings
   - Monthly Passes
4. **No** admin options visible

### Step 2: Logout and Login as Admin
1. Logout
2. Login with: admin-demo@test.com / adminpass123
3. See **Admin Dashboard** - shows global stats
4. **Plus** User Management section below stats
5. Can suspend/activate any user

### Step 3: Logout and Login as GarageHost
1. Logout
2. Login with: host-demo@test.com / hostpass123
3. See **GarageHost Dashboard** - can manage garage spaces
4. **Cannot** see admin panel or user management

## What's Actually Happening Behind the Scenes?

### When Suspended User Tries to Login:

```
Frontend: User clicks Login
         ↓
Backend:  /api/login endpoint
         ✓ checks email + password
         ✓ generates JWT token
         ↓
Frontend: Token stored in localStorage
         ↓
Frontend: Makes request to /api/dashboard/driver
         ↓
Backend:  Auth Middleware
         ✓ validates JWT token format
         ✓ checks database for user status
         ✗ finds status = "suspended"
         ✗ returns 403 "Account suspended"
         ↓
Frontend: Shows error message to user
```

### When Admin Suspends a User:

```
Frontend: Admin clicks Suspend button
         ↓
Backend:  PUT /api/admin/users/:id/suspend
         ✓ checks admin has Auth + Admin role
         ✓ finds user by ID
         ✓ updates status to "suspended"
         ✓ sends notification to user
         ↓
Frontend: Shows success alert
         ↓
Frontend: Refreshes user list
         Button changes from "Suspend" to "Activate"
```

## Key Points to Demonstrate

✅ **JWT tokens alone are NOT enough** - Status is checked on EVERY request
✅ **Immediate Effect** - Suspended user cannot access system on next API call
✅ **Role-Based Protection** - Drivers cannot access admin endpoints
✅ **Admin Control** - Only admins can manage user accounts
✅ **User Notifications** - Users get notified when suspended/reactivated

## Troubleshooting

### "Account suspended" error when user shouldn't be suspended
- Check admin dashboard - verify user is showing ✅ Active
- Click "Activate" if needed
- User can now login

### Admin buttons not appearing
- Make sure you're logged in as admin
- User must have role = "Admin" 
- Check browser console for errors

### Can't see user in list
- Run `node test-rbac-workflow.js` again to recreate test users
- Or register new test users manually
- Admin must be logged in to see user list

### Changes not showing up
- Refresh the page (F5)
- Click "Logout" and "Login" again
- Check that user ID is correct

## Running Automated Test

```bash
cd backend
node test-rbac-workflow.js
```

Expected output:
```
✓ Users created
✓ Credentials verified
✓ Tokens generated
✓ Suspended user blocked
✓ Reactivated user allowed
✓ Role-based access verified
✓ ALL TESTS PASSED
```

## API Calls You Can Make with Tools Like Postman

### 1. Register User
```
POST /api/register
Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "Driver"
}
```

### 2. Login
```
POST /api/login
Body: {
  "email": "test@example.com",
  "password": "password123"
}
Response: { token: "jwt_token_here", user: {...} }
```

### 3. Get Admin Dashboard (with valid admin token)
```
GET /api/dashboard/admin
Header: Authorization: Bearer {admin_token}
```

### 4. List All Users (admin only)
```
GET /api/admin/users
Header: Authorization: Bearer {admin_token}
```

### 5. Suspend User (admin only)
```
PUT /api/admin/users/{user_id}/suspend
Header: Authorization: Bearer {admin_token}
```

### 6. Activate User (admin only)
```
PUT /api/admin/users/{user_id}/activate
Header: Authorization: Bearer {admin_token}
```

## Visual Diagram of Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  User Login Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User enters email & password                           │
│     ↓                                                       │
│  2. Backend checks credentials ✓                           │
│     ↓                                                       │
│  3. JWT token generated                                    │
│     ↓                                                       │
│  4. Frontend stores token in localStorage                  │
│     ↓                                                       │
│  5. Frontend requests dashboard                            │
│     ↓                                                       │
│  6. Backend Auth Middleware:                               │
│     - Validates JWT? ✓                                     │
│     - Checks user status in DB                             │
│       ├─ Active? → Load Dashboard ✓                        │
│       └─ Suspended? → Block Access ✗                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Admin Suspend/Activate Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Admin views user list                                  │
│     Each user shows:                                       │
│     - Name, Email, Role                                    │
│     - Status (✅ Active or 🚫 Suspended)                    │
│     - Action Button                                        │
│     ↓                                                       │
│  2. Admin clicks Suspend/Activate                          │
│     Confirmation dialog appears                           │
│     ↓                                                       │
│  3. Backend updates user status                            │
│     Creates notification for user                         │
│     ↓                                                       │
│  4. Frontend refreshes user list                           │
│     Status shows updated icon                             │
│     Button changes accordingly                            │
│     ↓                                                       │
│  5. Changes take effect immediately                        │
│     Suspended user cannot use old JWT tokens              │
│     Auth middleware will reject them                       │
└─────────────────────────────────────────────────────────────┘
```
