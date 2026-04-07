# RBAC System - Visual Reference Guide

## System Architecture Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                       USER LOGIN FLOW                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                              ┌─────────────┐
                              │ User Enters │
                              │ Email + Pass│
                              └──────┬──────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
            ┌──────────────────┐         ┌──────────────────┐
            │  Username Match? │         │  Password Match? │
            │  (case-sensitive)│         │  (bcrypt compare)│
            └────────┬─────────┘         └────────┬─────────┘
                     │                            │
                 ✓ YES                         ✓ YES
                     │                            │
                     └────────────┬───────────────┘
                                  │
                              ▼▼▼▼▼
                    ┌─────────────────────────┐
                    │  JWT Token Generated    │
                    │ { userId, role }       │
                    │ (expires in 7 days)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    ▼                          ▼
             ┌──────────────┐         ┌──────────────┐
             │   Frontend   │         │   Backend    │
             │ Store in     │         │ Send JWT     │
             │ localStorage │         │ in response  │
             └──────────────┘         └──────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃               AUTHENTICATED API REQUEST FLOW                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Frontend Request:
┌────────────────────────────────────────────────────────┐
│ GET /api/dashboard/driver                              │
│ Headers:                                               │
│   Authorization: Bearer {jwt_token}                   │
│   Content-Type: application/json                       │
└─────────────────┬──────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │   Backend Received  │
         └─────────┬──────────┘
                   │
        ┌──────────┴───────────┐
        │  Line 1: Extract     │
        │  token from header   │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────────────────────────┐
        ▼                                         ▼
 ┌──────────────────┐                   ┌──────────────────┐
 │ Is token missing?│                   │ Check signature? │
 │                  │                   │                  │
 │ ✓ YES → 401 Error│ ✗ NO  ┌─────────►│ Valid signature? │
 └──────────────────┘       │           │                  │
                            │           │ ✓ YES  ┌────────►│
                            │           └────────┘ ✗ NO    │
                            │                      401 Error│
      ┌─────────────────────┴──────────────────────────────┘
      │
   ┌──┴──────────────────────────────────────┐
   ▼                     ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼ ▼     ▼
   Token Valid      JWT Middleware Passed
        │
    ┌───┴──────────────────────────────────────────┐
    │  Line 2: Query Database for User Status      │
    │  SELECT status FROM users WHERE _id = userId│
    └────────────┬─────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐       ┌─────────┐
   │ Status  │       │ Status  │
   │ ACTIVE  │       │SUSPENDED│
   │    ✓    │       │    ✗    │
   └────┬────┘       └────┬────┘
        │                 │
    Continue to      Return 403
    Layer 3           Forbidden
        │             "Account
        │              suspended"
        │
        ▼
   ┌──────────────────────┐
   │ Line 3: Role Check   │
   │ Role = Admin?        │
   │ Required: Admin      │
   │ Has: Driver          │
   │ ✗ Mismatch           │
   └────────┬─────────────┘
            │
        ┌───┴──────────────────┐
        ▼                      ▼
    Role OK              403 Forbidden
    Proceed          "Unauthorized - 
                      invalid role"
        │
        ▼
    ✓✓✓ ALL CHECKS PASSED
    Execute endpoint
    Return user list


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              ADMIN SUSPEND/ACTIVATE FLOW                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

ADMIN ACTIONS:
┌──────────────────────────────────┐
│ 1. Admin logs in                 │
│ 2. Sees "User Management" panel  │
│ 3. Views user list table:        │
│    ┌─────────────────────────┐   │
│    │Name│Email│Role│Status   │   │
│    ├─────────────────────────┤   │
│    │John│john@│Driv│✅Active │   │
│    │Jane│jane@│Host│✅Active │   │
│    └─────────────────────────┘   │
│ 4. Clicks "Suspend" button       │
└──────────────────┬───────────────┘
                   │
           ┌───────┴────────┐
           ▼                ▼
      Frontend          Backend
      Shows             PUT /admin/users
      confirmation      /:id/suspend
      dialog                │
           │                ▼
           │         ┌──────────────────┐
           │         │ Authorization:   │
           │         │ - Is Admin? ✓    │
           │         │ - Active? ✓      │
           │         └────────┬─────────┘
           │                  │
      User            ┌───────┴───────────┐
      Confirms        ▼                   ▼
           │    ┌────────────────┐  ┌──────────────┐
           │    │ Update DB:     │  │ Create       │
           │    │ status =       │  │ Notification │
           │    │ "suspended"    │  │ for user     │
           │    └────────┬───────┘  └──────────────┘
           │             │
           └─────┬───────┘
                 │
            ┌────▼──────┐
            ▼           ▼
      Frontend      Backend
      Refreshes     Returns 200
      User List   "User suspended"
           │
      ┌────┴──────────────────┐
      ▼                       ▼
   Button Changes      New Status
   "Suspend"    →      Shows 🚫
   to                  "Activate"
   "Activate"


SUSPENDED USER'S NEXT ACTION:
┌───────────────────────────────────┐
│ 1. User tries to use app          │
│ 2. Makes API request with token   │
│ 3. Request hits auth middleware   │
└───────────────────┬───────────────┘
                    │
        ┌───────────┴────────────┐
        ▼                        ▼
   Token Check            Status Check
   ✓ Valid                Query DB:
   ✓ Not Expired      SELECT status
   ✓ User exists      WHERE _id = ?
        │                     │
        │              ┌──────┴──────┐
        │              ▼             ▼
        │         status =       status =
        │         "active" ✓    "suspended" ✗
        │              │             │
        ▼              ▼             ▼
   Allowed           Continue      BLOCKED
   Proceed to      Authorization   403
   Layer 3         Check           "Account
                                   suspended"

   USER CANNOT ACCESS ANY FEATURE


ADMIN REACTIVATES:
┌──────────────────────┐
│ Admin finds user     │
│ Sees 🚫 Suspended    │
│ Clicks "Activate"    │
│ Confirms             │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
API Call      Backend
PUT           Updates DB:
/admin/users  status =
/:id/activate "active"
    │             │
    │      ┌──────┴──────┐
    │      ▼             ▼
    │   Creates      Returns
    │   Notification 200 OK
    │   for user
    │      │
    └──────┴───┐
               │
        ┌──────┴──────┐
        ▼             ▼
   Frontend        User List
   Refreshes       Updates:
                   Button returns
                   to "Suspend"
                   Status: ✅

USER CAN LOGIN AGAIN:
┌───────────────────────────┐
│ User logs in with email   │
│ Tries API request         │
│ Middleware checks status  │
│ Finds: "active"           │
│ ✓ Access Granted          │
│ Dashboard loads           │
│ All features work again   │
└───────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                 ROLE-BASED ACCESS CONTROL                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

DRIVER ROLE:
┌────────────────────────────────────────┐
│ Can Access:                            │
│ ✓ GET /api/dashboard/driver            │
│ ✓ GET /api/garage-spaces/all           │
│ ✓ POST /api/bookings                   │
│ ✓ GET /api/bookings/my                 │
│ ✓ POST /api/waitlist                   │
│ ✓ GET /api/subscriptions/my            │
│                                        │
│ Cannot Access:                         │
│ ✗ GET /api/admin/users                 │
│ ✗ PUT /api/admin/users/:id/suspend     │
│ ✗ POST /api/garage-spaces              │
│ ✗ GET /api/dashboard/garage-host       │
└────────────────────────────────────────┘

GARAGEHOST ROLE:
┌────────────────────────────────────────┐
│ Can Access:                            │
│ ✓ GET /api/dashboard/garage-host       │
│ ✓ GET /api/garage-spaces               │
│ ✓ POST /api/garage-spaces              │
│ ✓ PUT /api/garage-spaces/:id           │
│ ✓ GET /api/notifications               │
│                                        │
│ Cannot Access:                         │
│ ✗ GET /api/admin/users                 │
│ ✗ POST /api/bookings                   │
│ ✗ GET /api/subscriptions/my            │
│ ✗ PUT /api/admin/users/:id/suspend     │
└────────────────────────────────────────┘

ADMIN ROLE:
┌────────────────────────────────────────┐
│ Can Access:                            │
│ ✓ GET /api/dashboard/admin             │
│ ✓ GET /api/admin/users                 │
│ ✓ PUT /api/admin/users/:id/suspend     │
│ ✓ PUT /api/admin/users/:id/activate    │
│ ✓ PUT /api/admin/users/:id/role        │
│ ✓ Everything other roles can access    │
│                                        │
│ Cannot Access:                         │
│ ✗ Nothing (full access)                │
└────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   DATABASE STATUS FLOW                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

USER COLLECTION:
┌──────────────────────────────────────────────────────────┐
│ Users Table:                                             │
│ ┌─────┬──────────────┬────────┬─────────────┬────────┐   │
│ │ _id │ name         │ email  │ role        │ status │   │
│ ├─────┼──────────────┼────────┼─────────────┼────────┤   │
│ │ 123 │ John Driver  │ john@  │ Driver      │ active │   │
│ │ 124 │ Jane Host    │ jane@  │ GarageHost  │ active │   │
│ │ 125 │ Bob Admin    │ bob@   │ Admin       │ active │   │
│ │ 126 │ Sam Driver   │ sam@   │ Driver      │suspend │← │
│ │ 127 │ Eve Driver   │ eve@   │ Driver      │ active │   │
│ └─────┴──────────────┴────────┴─────────────┴────────┘   │
│                                                          │
│ When admin suspends user 126:                          │
│   UPDATE users SET status = "suspended"                │
│   WHERE _id = 126                                      │
│                                                        │
│ When Sam tries API request:                           │
│   SELECT status FROM users WHERE _id = 126            │
│   Result: "suspended"                                 │
│   Middleware: BLOCK REQUEST (403)                     │
└──────────────────────────────────────────────────────────┘


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   MIDDLEWARE STACK ORDER                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

API Request comes in:
       │
       ▼
   authMiddleware()  ← Layer 1: JWT + Status Check
   │  - Verify JWT signature
   │  - Check JWT not expired
   │  - Query DB for current status
   │  - If not active → 403 "Account suspended"
   │  - Check user exists
   │
   ▼ (if authMiddleware passes)
   
   roleMiddleware(["Admin"])  ← Layer 2: Role Check
   │  - Is user role in allowed list?
   │  - If not → 403 "Unauthorized - invalid role"
   │
   ▼ (if roleMiddleware passes)
   
   Controller Handler (e.g., listUsers)
   │  - Execute the actual endpoint logic
   │  - Query database for users
   │  - Return response
   │
   ▼
   
   Response sent to client


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    HTTP STATUS CODES                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

200 OK - Request successful, return data
201 Created - User created successfully
400 Bad Request - Invalid data (missing fields, etc)
401 Unauthorized - No token or invalid token
403 Forbidden - Two scenarios:
    ├─ Account suspended (status check failed)
    └─ Wrong role (role check failed)
404 Not Found - User doesn't exist
500 Server Error - Database or backend error

How to know which 403?
├─ Message: "Account suspended" → Status check failed
└─ Message: "Unauthorized - invalid role" → Role check failed


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     QUICK DECISION TREE                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

"User can't access dashboard"
├─ Is user logged in?
│  ├─ NO → Tell user to login
│  └─ YES → Continue
├─ Do they have valid token?
│  ├─ NO → Tell user to login again
│  └─ YES → Continue
├─ Is user status "active"?
│  ├─ NO → User is SUSPENDED
│  │   ├─ Check admin feedback for reason
│  │   ├─ Contact support
│  │   └─ Wait for admin to reactivate
│  └─ YES → Continue
├─ Is user role correct?
│  ├─ NO → User doesn't have permission
│  │   └─ This is wrong role for endpoint
│  └─ YES → Dashboard loads! ✓

"User got 403 error"
├─ Endpoint requires admin?
│  ├─ YES → Is user admin? NO → Tell user insufficient permissions
│  └─ NO → Is account suspended? YES → Tell user account is suspended
└─ Contact admin if issue

"Need to suspend user quickly"
├─ Is user abusing system?
│  └─ YES → Go to admin dashboard
│     └─ Find user in list
│        └─ Click "Suspend" button
│           └─ USER BLOCKED IMMEDIATELY ✓

"User accidentally suspended"
├─ Go to admin dashboard
├─ Find user in list
├─ See 🚫 Suspended status
├─ Click "Activate" button
└─ USER CAN LOGIN AGAIN ✓
```

---

## Key Points to Remember

✅ **Status is checked on EVERY request** - changes take effect immediately
✅ **Token alone is not enough** - valid JWT can still be blocked if suspended
✅ **Database is the source of truth** - status always queried from DB, never cached in token
✅ **Changes are instant** - no waiting for token to expire
✅ **Users are notified** - when suspended or reactivated
✅ **Three layers of security** - Auth + Status + Role
✅ **Admin has full control** - can suspend/activate anyone (except themselves)
