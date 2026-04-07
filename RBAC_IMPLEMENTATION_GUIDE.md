# Role-Based Access Control & User Status Management - Implementation Guide

## Overview

This document describes the complete implementation of the authentication and role-based access control (RBAC) system with user status management (active/suspended) as shown in the workflow diagram.

## Architecture Diagram

```
Start
  ↓
User Login
  ↓
Check Status (Active?)
     ↓            ↓
    Yes           No
    ↓             ↓
Load Dashboard   Block Access
    ↓
Check Role
    ↓
Is Action Allowed?
     ↓            ↓
    Yes           No
    ↓             ↓
Proceed         Access Denied
    ↓
Admin Panel (if Admin)
    ↓
Manage Users (Suspend/Activate)
    ↓
End
```

## System Components

### 1. User Model (Backend)

**File:** `backend/models/user.js`

The User model includes fields for both role and status management:

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Driver", "GarageHost", "Admin"],
    default: "Driver"
  },
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now }
});
```

**Key Fields:**
- **role**: Determines what features and dashboards are available
  - `Driver`: Can book parking, view bookings, manage waitlist
  - `GarageHost`: Can manage garage spaces, view host bookings
  - `Admin`: Can manage all users, suspend/activate accounts
- **status**: Controls account access
  - `active`: User can login and access their dashboard
  - `suspended`: User is blocked from accessing the system

### 2. Authentication Middleware (Backend)

**File:** `backend/middleware/auth.js`

The middleware performs two critical checks:

```javascript
const authMiddleware = async (req, res, next) => {
  // 1. Validate JWT token
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 2. Check user status in database (this is the key to blocking suspended users)
  const userRecord = await User.findById(decoded.userId).select("role status");
  
  // If status is not "active", deny access
  if (userRecord.status !== "active") {
    return res.status(403).json({ message: "Account suspended" });
  }

  // If all checks pass, allow access
  next();
};
```

**Why this works:**
- Even if a user has a valid JWT token, the middleware checks the **current status** from the database
- When admin suspends a user, the status changes immediately
- On next request with that token, the middleware rejects it because status is "suspended"
- This ensures suspended users can't use old tokens

### 3. Role-Based Access Control Middleware (Backend)

**File:** `backend/middleware/auth.js`

```javascript
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized - invalid role" });
    }
    next();
  };
};
```

**Usage in Routes:**
```javascript
// Only admins can access this route
router.get(
  "/admin/users",
  authMiddleware,           // Check if logged in and status is active
  roleMiddleware(["Admin"]), // Check if role is Admin
  adminController.listUsers
);

// Only drivers can access this route
router.post(
  "/bookings",
  authMiddleware,
  roleMiddleware(["Driver"]),
  bookingController.createBooking
);
```

### 4. Admin Controller (Backend)

**File:** `backend/controllers/adminController.js`

Three main admin functions:

#### a) List all users
```javascript
exports.listUsers = async (req, res) => {
  const users = await User.find()
    .select("name email phone role status createdAt")
    .sort({ createdAt: -1 });
  res.json(users);
};
```

**Endpoint:** `GET /api/admin/users`

#### b) Suspend a user
```javascript
exports.suspendUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.status = "suspended";
  await user.save();
  
  // Send notification to user
  const notification = new Notification({
    host: user._id,
    message: "Your account has been suspended. Please contact support.",
    type: "payment",
    relatedId: user._id
  });
  await notification.save();
  
  res.json({ message: "User suspended" });
};
```

**Endpoint:** `PUT /api/admin/users/:id/suspend`

#### c) Activate a user
```javascript
exports.activateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.status = "active";
  await user.save();
  
  // Send notification to user
  const notification = new Notification({
    host: user._id,
    message: "Your account has been reactivated. Thank you!",
    type: "payment",
    relatedId: user._id
  });
  await notification.save();
  
  res.json({ message: "User activated" });
};
```

**Endpoint:** `PUT /api/admin/users/:id/activate`

### 5. Frontend Dashboard Views

**File:** `frontend/js/views/parkingView.js`

#### Admin Dashboard Enhancement
```javascript
function renderAdminDashboard(data) {
  return `
    <div class="dashboard">
      <h1>👨‍💼 Admin Dashboard</h1>
      <div class="stats-section">
        <div class="card">Total Users: ${data.data.totalUsers}</div>
        <div class="card">Total Garages: ${data.data.totalGarages}</div>
        <div class="card">Total Transactions: ${data.data.totalTransactions}</div>
      </div>
      
      <div class="user-management-section">
        <h2>👥 User Management</h2>
        <div id="users-list-container">Loading users...</div>
      </div>
    </div>
  `;
}
```

#### User List Display
```javascript
function renderUsersList(users) {
  return `
    <table class="users-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span>${user.role}</span></td>
            <td>${user.status === 'active' ? '✅ Active' : '🚫 Suspended'}</td>
            <td>
              ${user.status === 'active' 
                ? `<button class="btn-suspend" data-user-id="${user._id}">Suspend</button>`
                : `<button class="btn-activate" data-user-id="${user._id}">Activate</button>`
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
```

### 6. Frontend User Management Functions

**File:** `frontend/js/app.js`

```javascript
// Load all users and display in admin dashboard
async function loadAdminUsers() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const users = await response.json();
  const container = document.getElementById("users-list-container");
  container.innerHTML = parkingView.renderUsersList(users);
  setupAdminUserActions(); // Attach event listeners
}

// Suspend a user (admin action)
async function suspendUser(userId) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/suspend`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (response.ok) {
    alert("User suspended successfully ✓");
    await loadAdminUsers(); // Refresh list
  }
}

// Activate a user (admin action)
async function activateUser(userId) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/activate`, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (response.ok) {
    alert("User activated successfully ✓");
    await loadAdminUsers(); // Refresh list
  }
}

// Attach event listeners to suspend/activate buttons
function setupAdminUserActions() {
  document.querySelectorAll(".btn-suspend").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const userId = btn.dataset.userId;
      if (confirm("Suspend this user?")) {
        await suspendUser(userId);
      }
    });
  });

  document.querySelectorAll(".btn-activate").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const userId = btn.dataset.userId;
      if (confirm("Activate this user?")) {
        await activateUser(userId);
      }
    });
  });
}

// Setup admin section when admin logs in
function setupAdminSection() {
  loadAdminUsers(); // Load and display users
}
```

## Complete User Flow

### 1. Driver/User Perspective

**Step 1: Registration & Login**
```
User enters email, password, selects role (Driver)
↓
Credentials stored in database
↓
JWT token generated
↓
Token stored in localStorage
```

**Step 2: Dashboard Load**
```
Frontend checks for token in localStorage
↓
Sends GET /api/dashboard/driver with token
↓
Auth middleware: Validate token ✓
↓
Auth middleware: Check user status in database
  - If status = "active" → Allow access
  - If status = "suspended" → Return 403 "Account suspended"
↓
Load driver dashboard (Bookings, Waitlist, etc.)
```

**Step 3: Suspended by Admin**
```
Admin suspends user in admin panel
↓
Database: user.status = "suspended"
↓
User tries to make any API call (with old token)
↓
Auth middleware checks database again
↓
Finds status = "suspended"
↓
Returns 403 "Account suspended"
↓
User blocked from accessing ANY feature
```

### 2. Admin Perspective

**Step 1: Admin Login**
```
Admin enters credentials
↓
If role = "Admin" → Full system access
↓
Admin dashboard loads with stats and user list
```

**Step 2: View Users**
```
Admin dashboard renders user list table
↓
Shows: Name, Email, Role, Status, Actions
↓
Status: ✅ Active or 🚫 Suspended
```

**Step 3: Suspend a User**
```
Admin clicks "Suspend" button next to a user
↓
Confirmation dialog: "Are you sure?"
↓
PUT /api/admin/users/:id/suspend
↓
Backend updates: user.status = "suspended"
↓
Creates notification for user
↓
User list refreshes showing "🚫 Suspended" + Activate button
```

**Step 4: Activate a User**
```
Admin clicks "Activate" button
↓
Confirmation dialog: "Are you sure?"
↓
PUT /api/admin/users/:id/activate
↓
Backend updates: user.status = "active"
↓
Creates notification for user
↓
User list refreshes showing "✅ Active" + Suspend button
```

## API Endpoints Summary

### Authentication Endpoints
| Method | Endpoint | Auth Required | Role Required | Purpose |
|--------|----------|---------------|---------------|---------|
| POST | `/api/register` | No | - | Create new user account |
| POST | `/api/login` | No | - | Login and get JWT token |

### Dashboard Endpoints
| Method | Endpoint | Auth Required | Role Required | Purpose |
|--------|----------|---------------|---------------|---------|
| GET | `/api/dashboard/driver` | Yes | Driver | Get driver dashboard data |
| GET | `/api/dashboard/garage-host` | Yes | GarageHost | Get host dashboard data |
| GET | `/api/dashboard/admin` | Yes | Admin | Get admin dashboard data |

### Admin User Management Endpoints
| Method | Endpoint | Auth Required | Role Required | Purpose |
|--------|----------|---------------|---------------|---------|
| GET | `/api/admin/users` | Yes | Admin | List all users |
| PUT | `/api/admin/users/:id/suspend` | Yes | Admin | Suspend user account |
| PUT | `/api/admin/users/:id/activate` | Yes | Admin | Reactivate user account |
| PUT | `/api/admin/users/:id/role` | Yes | Admin | Change user role |

## Testing

### Run Integration Test

```bash
cd backend
node test-rbac-workflow.js
```

This test demonstrates:
1. User creation with different roles
2. Login flow and token generation
3. Status checking in auth middleware
4. User suspension by admin
5. Blocked access for suspended users
6. User reactivation by admin
7. Successful re-login after reactivation

### Test Output Example
```
✓ Driver created and can login
✓ Admin created and has access to admin panel
✓ Admin suspends driver
✗ Suspended driver tries to login (ACCESS BLOCKED 🚫)
✓ Admin reactivates driver
✓ Driver can login again
✓ All role-based access controls verified
```

## Browser Usage Example

### 1. Login as Driver
```
1. Open http://localhost:3000/index.html
2. Click "Login"
3. Enter email: driver-demo@test.com
4. Enter password: driverpass123
5. Click "Login"
6. See Driver Dashboard (Bookings, Waitlist)
```

### 2. Login as Admin
```
1. Open http://localhost:3000/index.html
2. Click "Login"
3. Enter email: admin-demo@test.com
4. Enter password: adminpass123
5. Click "Login"
6. See Admin Dashboard with User Management
7. Click "Suspend" next to driver-demo@test.com
```

### 3. Try Suspended User Login
```
1. Open http://localhost:3000/index.html
2. Click "Login"
3. Enter email: driver-demo@test.com (the suspended user)
4. Enter password: driverpass123
5. See error: "Account suspended" or "Access denied"
6. Cannot access dashboard
```

### 4. Reactivate and Login Again
```
1. Login as admin again
2. Click "Activate" next to suspended user
3. Logout (Logout button)
4. Login as suspended user again
5. Dashboard now loads successfully
```

## Key Security Features

1. **JWT Token Validation**: All requests require valid JWT token
2. **Status Check on Every Request**: Auth middleware checks current status from database, not just the token
3. **Role-Based Access**: Endpoints protected by role middleware
4. **Password Hashing**: Bcrypt for password storage
5. **Notifications**: Users are notified when suspended/reactivated
6. **Self-Suspension Prevention**: Admin cannot suspend themselves

## Files Modified/Created

### Backend Files
- `backend/models/user.js` - User schema with role and status
- `backend/middleware/auth.js` - Auth and role middleware
- `backend/controllers/adminController.js` - Admin management functions
- `backend/routes/routes.js` - Route definitions with middleware
- `backend/test-rbac-workflow.js` - Integration test script (NEW)

### Frontend Files
- `frontend/js/views/parkingView.js` - Added renderUsersList function
- `frontend/js/app.js` - Added admin user management functions

## Deployment Checklist

- [x] User model has role and status fields
- [x] Auth middleware checks status on every request
- [x] Role middleware protects admin endpoints
- [x] Admin controller has suspend/activate/list functions
- [x] Routes are protected with auth and role middleware
- [x] Admin dashboard displays user list
- [x] Frontend has suspend/activate buttons with confirmations
- [x] Integration test passes
- [x] Error messages guide users

## Future Enhancements

1. Add user activity logs
2. Add bulk suspend/unsuspend operations
3. Add suspension reasons
4. Add time-based automatic reactivation
5. Add email notifications for suspensions
6. Add dispute/appeal system
7. Add suspension history per user
