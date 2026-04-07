# RBAC System Architecture Deep Dive

## The Three Layers of Protection

### Layer 1: Authentication (User Identity)
```
┌─────────────────────────────────────┐
│  "Are you who you claim to be?"     │
├─────────────────────────────────────┤
│ JWT Token Validation                │
│ - Token is valid (not expired)       │
│ - Token signature is correct         │
│ - User exists in database            │
└─────────────────────────────────────┘
```

**Implementation:**
- Backend: `middleware/auth.js` - Line 1-15
- Check: `jwt.verify(token, JWT_SECRET)`
- Issue: 401 Unauthorized if fails

### Layer 2: Status Check (Account Accessibility)
```
┌──────────────────────────────────────┐
│  "Is your account active?"           │
├──────────────────────────────────────┤
│ Database Status Check                │
│ - Query current user status from DB  │
│ - Status field: "active" or "suspended"
│ - Check on EVERY request             │
└──────────────────────────────────────┘
```

**Implementation:**
- Backend: `middleware/auth.js` - Line 16-21
- Query: `User.findById(decoded.userId).select("status")`
- Issue: 403 Forbidden if suspended
- **Why this works**: Even with valid token, current DB status matters

### Layer 3: Authorization (Role-Based Access)
```
┌─────────────────────────────────────┐
│  "Are you allowed to do this?"      │
├─────────────────────────────────────┤
│ Role Check                          │
│ - Driver: Only booking operations   │
│ - GarageHost: Only garage ops       │
│ - Admin: Everything                 │
└─────────────────────────────────────┘
```

**Implementation:**
- Backend: `middleware/auth.js` - Line 32-39
- Check: `allowedRoles.includes(req.user.role)`
- Issue: 403 Forbidden if role doesn't match

## Request Flow with All Three Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  User Makes API Request                                         │
│  Example: GET /api/admin/users with JWT token                  │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication Middleware                             │
│  ✓ Token exists?                                                │
│  ✓ Token valid signature?                                       │
│  ✓ Token not expired?                                           │
│  ✓ User ID exists in token?                                     │
│  If ALL ✓: Continue to Layer 2                                  │
│  If any ✗: Return 401 "Invalid token"                           │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Status Check (NEW - The Key Feature)                 │
│  ✓ Query database: SELECT status FROM users WHERE _id=userId    │
│  ✓ Is status = "active"?                                        │
│  If ✓: Continue to Layer 3                                      │
│  If ✗: Return 403 "Account suspended"                           │
│                                                                 │
│  WHY THIS IS CRITICAL:                                          │
│  - Old JWT tokens can't bypass this                             │
│  - Status changes take effect IMMEDIATELY                       │
│  - Admin can control access in real-time                        │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Role-Based Authorization                              │
│  ✓ What role is required for this endpoint?                     │
│  ✓ Does user's role match?                                      │
│  ✓ Admin role required for /admin/users?                        │
│  User role is Admin?                                            │
│  If ✓: Execute endpoint                                         │
│  If ✗: Return 403 "Unauthorized - invalid role"                 │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Access Granted! Return user list                             │
└─────────────────────────────────────────────────────────────────┘
```

## What Makes Status Check So Powerful?

### Before (Without Status Check)
```javascript
// Old way - INSECURE
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next(); // ← User gets access forever until token expires!
};

Timeline:
Day 1: User logs in, gets token (expires in 7 days)
Day 2: Admin suspends user
Day 3: User still has old token... they CAN STILL ACCESS!
       Token won't expire for 4 more days
```

### After (With Status Check)
```javascript
// New way - SECURE
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // THE KEY LINE: Always check current status
  const userRecord = await User.findById(decoded.userId);
  
  if (userRecord.status !== "active") {
    return res.status(403).json({ message: "Account suspended" });
  }
  
  req.user = decoded;
  next();
};

Timeline:
Day 1: User logs in, gets token (expires in 7 days)
Day 2: Admin suspends user → DB updated
Day 3: User tries to use old token
       Auth middleware queries database
       Finds status = "suspended"
       BLOCKS ACCESS IMMEDIATELY ✓
```

## Code Walkthrough: How Suspension Works

### 1. Admin Suspends User (Backend)

**File: `controllers/adminController.js`**
```javascript
exports.suspendUser = async (req, res) => {
  const { id } = req.params;  // User ID from URL
  
  // Find user in database
  const user = await User.findById(id);
  
  // Change status from "active" to "suspended"
  user.status = "suspended";  // ← The key change
  
  // Save to database
  await user.save();
  
  // Notify user
  const notification = new Notification({
    host: user._id,
    message: "Your account has been suspended...",
    type: "payment",
    relatedId: user._id
  });
  await notification.save();
  
  // Return success
  res.json({ message: "User suspended" });
};
```

### 2. Suspended User Tries to Access System (frontend)

**File: `js/app.js`**
```javascript
async function handleLogin() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Login endpoint always returns token if password is correct
    localStorage.setItem("token", data.token);
    
    // Now try to load dashboard
    loadDashboard(data.user.role);
  }
}
```

### 3. Auth Middleware Checks Status (backend)

**File: `middleware/auth.js`** (when loadDashboard calls /api/dashboard/driver)
```javascript
const authMiddleware = async (req, res, next) => {
  try {
    // Step 1: Get token from request header
    const token = req.headers.authorization?.split(" ")[1];
    
    // Step 2: Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // Attach user info
    
    // Step 3: ← THIS IS THE MAGIC PART
    // Load user FROM DATABASE to check CURRENT status
    const User = require("../models/user");
    const userRecord = await User.findById(decoded.userId)
      .select("role status");  // Only get role and status
    
    if (!userRecord) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Step 4: ← THIS IS THE CRITICAL CHECK
    // If status is NOT "active", deny access
    if (userRecord.status !== "active") {
      return res.status(403).json({ 
        message: "Account suspended" 
      });
    }
    
    // Step 5: Update role from latest DB record
    req.user.role = userRecord.role;
    
    // Step 6: Allow request to proceed
    next();
    
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

### 4. Frontend Receives Error (browser)

**File: `js/app.js`** (in loadDashboard function)
```javascript
const response = await fetch( `/api/dashboard/driver`, {
  method: "GET",
  headers: { 
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json" 
  }
});

if (response.ok) {
  // Load dashboard...
} else if (response.status === 403) {
  // ← 403 means "Forbidden" - likely status check failed
  parkingView.showError("auth", "Account suspended");
  logout();  // Force logout
}
```

## The Admin Panel (Frontend)

### How User List Loads

```javascript
// When admin logs in...
else if (role === "Admin") {
  parkingView.renderAdminDashboard(data);
  setupAdminSection();  // ← Load users
}

// setupAdminSection calls loadAdminUsers()
async function loadAdminUsers() {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${admin_token}` }
  });
  
  const users = await response.json();  // Get all users
  
  // Display in table with suspend/activate buttons
  container.innerHTML = parkingView.renderUsersList(users);
  
  // Attach click handlers
  setupAdminUserActions();
}
```

### How Suspend Button Works

```javascript
// When admin clicks "Suspend" button next to user...
document.querySelectorAll(".btn-suspend").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const userId = btn.dataset.userId;  // Get user ID
    
    if (confirm("Are you sure?")) {
      // Make API request to suspend
      const response = await fetch(
        `/api/admin/users/${userId}/suspend`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${admin_token}` }
        }
      );
      
      if (response.ok) {
        alert("User suspended successfully ✓");
        await loadAdminUsers();  // Refresh list
      }
    }
  });
});
```

## Security Principles Demonstrated

### 1. Defense in Depth
Multiple layers of checks, not just one

### 2. Immediate Effect
Status checked on EVERY request, not cached

### 3. Database Authority
Current status always comes from DB, not token

### 4. User Notifications
Users are informed when their status changes

### 5. Audit Trail
Notifications create a record of admin actions

## Performance Considerations

**Won't the extra database query per request slow things down?**

Answer: Minimal impact because:
1. Only selects 2 fields (role, status) - very fast
2. Indexes on `_id` (primary key) and `role` field
3. User does NOT have many fields, DB lookup is O(1)
4. Network from middleware to DB in same datacenter
5. Typical query time: 1-5ms

## Comparison: Other Approaches

### Approach 1: Cache Status in Token (BAD)
```
Token includes: { userId, role, status }
Problem: Can't revoke until token expires (7 days!)
Risk: Suspended user keeps working for days
```

### Approach 2: Check DB Every Request (GOOD) ✓
```
Token includes: { userId, role }
Every request: Query DB for current status
Benefit: Changes take effect immediately
Our choice: This is what we implemented
```

### Approach 3: Session-Based (LEGACY)
```
Store session on server
Problem: Requires server memory/storage
Better for: Single server applications
```

## Practical Examples

### Example 1: Abusive User
```
Admin: "This user has violated terms"
Admin: Clicks Suspend button
System: Updates DB status = "suspended"
User: Makes next API request with valid token
Middleware: Queries DB, finds suspended status
User: Gets 403 Forbidden error
Result: User immediately blocked ✓
```

### Example 2: False Suspension
```
Admin: Accidentally suspends wrong user
User: Complains about blocked access
Admin: Clicks Activate button
System: Updates DB status = "active"
User: Makes next request
Middleware: Queries DB, finds active status
User: Access restored ✓
Result: Takes effect on next request
```

### Example 3: Role Change
```
User: Was Driver, promoted to GarageHost
Admin: Changes role in user list
System: Updates DB role = "GarageHost"
User: Makes request to /garage-spaces
Middleware: Queries DB, gets role = "GarageHost"
Role middleware: Allows access to /garage-spaces
User: New permissions working ✓
Result: Change takes effect immediately
```
