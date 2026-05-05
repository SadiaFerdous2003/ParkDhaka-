/**
 * CSE 470 - Software Quality Assurance
 * Student ID : 22299169
 * Feature    : FR-2 – Role-Based Registration & Dashboard Access
 * Framework  : Jest + Supertest (MERN / Express.js)
 *
 * HOW TO RUN:
 *   npx jest tests/22299169_auth_system.test.js --verbose
 *
 * PRE-REQUISITE:
 *   In server.js, add this line BEFORE app.listen():
 *     module.exports = app;
 */
 
const request = require("supertest");
const app     = require("../server"); // ← matches your server.js file
 
// ─────────────────────────────────────────────
//  Shared tokens (populated dynamically)
// ─────────────────────────────────────────────
let driverToken = "";
let hostToken   = "";
let adminToken  = "";
 
// Unique timestamp so test emails never clash on repeated runs
const ts = Date.now();
 
// ── Test user payloads ──
const driverUser = {
  name:     "Test Driver",
  email:    `driver_${ts}@test.com`,
  password: "Driver@1234",
  role:     "Driver",       // exact role string your backend uses
};
 
const hostUser = {
  name:     "Test Host",
  email:    `host_${ts}@test.com`,
  password: "Host@1234",
  role:     "GarageHost",   // exact role string your backend uses
};
 
// ── Replace with your real seeded Admin credentials ──
const adminCredentials = {
  email:    "admin@gmail.com",   // ← your actual admin email in DB
  password: "12345",            // ← your actual admin password
};
 
// ═══════════════════════════════════════════════════════════
//  DESCRIBE — FR-2: Role-Based Registration & Dashboard Access
// ═══════════════════════════════════════════════════════════
describe("FR-2: Role-Based Registration & Dashboard Access (ID: 22299169)", () => {
 
  // ── PRE-CONDITION: Fetch admin token dynamically (no hardcoded tokens) ──
  beforeAll(async () => {
    const res = await request(app)
      .post("/api/login")
      .send(adminCredentials);
 
    adminToken = res.body.token || "";
  }, 15000);
 
  // ─────────────────────────────────────────────────────────
  //  CASE A — POSITIVE FLOW (Happy Path)
  // ─────────────────────────────────────────────────────────
 
  // TEST 1: Register as Driver
  it("✅ [POSITIVE] should register a new Driver and return 201", async () => {
    const res = await request(app)
      .post("/api/register")
      .send(driverUser);
 
    expect(res.statusCode).toEqual(201);
    // Response must carry either a token or a user object
    const hasToken = !!(res.body.token);
    const hasUser  = !!(res.body.user || res.body._id);
    expect(hasToken || hasUser).toBe(true);
  });
 
  // TEST 2: Register as GarageHost
  it("✅ [POSITIVE] should register a new GarageHost and return 201", async () => {
    const res = await request(app)
      .post("/api/register")
      .send(hostUser);
 
    expect(res.statusCode).toEqual(201);
    const hasToken = !!(res.body.token);
    const hasUser  = !!(res.body.user || res.body._id);
    expect(hasToken || hasUser).toBe(true);
  });
 
  // TEST 3: Login as Driver → get JWT
  it("✅ [POSITIVE] should login as Driver and return a JWT token (200)", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: driverUser.email, password: driverUser.password });
 
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeTruthy();
 
    driverToken = res.body.token; // store for later tests
  });
 
  // TEST 4: Login as GarageHost → get JWT
  it("✅ [POSITIVE] should login as GarageHost and return a JWT token (200)", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: hostUser.email, password: hostUser.password });
 
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeTruthy();
 
    hostToken = res.body.token; // store for later tests
  });
 
  // TEST 5: Driver accesses Driver dashboard
  it("✅ [POSITIVE] should allow Driver to access GET /api/dashboard/driver (200)", async () => {
    const res = await request(app)
      .get("/api/dashboard/driver")
      .set("Authorization", `Bearer ${driverToken}`);
 
    expect(res.statusCode).toEqual(200);
  });
 
  // TEST 6: GarageHost accesses GarageHost dashboard
  it("✅ [POSITIVE] should allow GarageHost to access GET /api/dashboard/garage-host (200)", async () => {
    const res = await request(app)
      .get("/api/dashboard/garage-host")
      .set("Authorization", `Bearer ${hostToken}`);
 
    expect(res.statusCode).toEqual(200);
  });
 
  // TEST 7: Admin accesses Admin dashboard
  it("✅ [POSITIVE] should allow Admin to access GET /api/dashboard/admin (200)", async () => {
    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Authorization", `Bearer ${adminToken}`);
 
    expect(res.statusCode).toEqual(200);
  });
 
  // ─────────────────────────────────────────────────────────
  //  CASE B — NEGATIVE FLOW (Error Handling)
  // ─────────────────────────────────────────────────────────
 
  // TEST 8: Registration with missing email → 400
  it("❌ [NEGATIVE] should return 400 if email is missing during registration", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ name: "No Email User", password: "Test@1234", role: "Driver" });
 
    expect(res.statusCode).toEqual(400);
    // Backend must return an error message field
    expect(res.body.message || res.body.error).toBeTruthy();
  });
 
  // TEST 9: Registration with missing password → 400
  it("❌ [NEGATIVE] should return 400 if password is missing during registration", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ name: "No Pass User", email: `nopass_${ts}@test.com`, role: "Driver" });
 
    expect(res.statusCode).toEqual(400);
  });
 
  // TEST 10: Login with non-existent credentials → 401
  it("❌ [NEGATIVE] should return 401 for completely wrong login credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "ghost_user@nowhere.com", password: "WrongPass999" });
 
    // Accept 400 or 401 — both are valid "invalid credentials" responses
    expect([400, 401]).toContain(res.statusCode);
  });
 
  // TEST 11: Registration with invalid role → 400
  it("❌ [NEGATIVE] should return 400 for an unrecognized role value", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        name:     "Bad Role User",
        email:    `badrole_${ts}@test.com`,
        password: "Test@1234",
        role:     "Supervillain",   // not a valid role in the system
      });
 
    expect(res.statusCode).toEqual(400);
  });
 
  // ─────────────────────────────────────────────────────────
  //  CASE C — SECURITY & ROLE BOUNDARY CHECKS
  // ─────────────────────────────────────────────────────────
 
  // TEST 12: Request with NO token → 401
  it("🔒 [SECURITY] should return 401 when Authorization header is absent", async () => {
    const res = await request(app)
      .get("/api/dashboard/driver");
      // intentionally no .set("Authorization", ...)
 
    expect([401, 403]).toContain(res.statusCode);
  });
 
  // TEST 13: Driver cannot access Admin dashboard → 403
  it("🔒 [SECURITY] should return 403 when a Driver accesses /api/dashboard/admin", async () => {
    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Authorization", `Bearer ${driverToken}`);
 
    expect(res.statusCode).toEqual(403);
  });
 
  // TEST 14: GarageHost cannot access Admin dashboard → 403
  it("🔒 [SECURITY] should return 403 when a GarageHost accesses /api/dashboard/admin", async () => {
    const res = await request(app)
      .get("/api/dashboard/admin")
      .set("Authorization", `Bearer ${hostToken}`);
 
    expect(res.statusCode).toEqual(403);
  });
 
  // TEST 15: Tampered JWT → 401
  it("🔒 [SECURITY] should return 401 for a tampered or invalid JWT token", async () => {
    const res = await request(app)
      .get("/api/dashboard/driver")
      .set("Authorization", "Bearer this.is.a.completely.fake.token");
 
    expect([401, 403]).toContain(res.statusCode);
  });
 
});