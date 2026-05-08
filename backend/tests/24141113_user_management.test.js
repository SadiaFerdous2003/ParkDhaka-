const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/user');

let adminToken = '';
let driverToken = '';
let testUserId = '';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  await User.deleteMany({});

  const admin = new User({ name: 'Admin User', email: 'admin@example.com', password: 'AdminPass123', role: 'Admin' });
  await admin.save();

  const driver = new User({ name: 'Driver User', email: 'driver@example.com', password: 'DriverPass123', role: 'Driver' });
  await driver.save();
  testUserId = driver._id.toString();

  // PRE-CONDITION: Dynamic Auth
  const adminLoginRes = await request(app)
    .post('/api/login')
    .send({ email: 'admin@example.com', password: 'AdminPass123' });
  adminToken = adminLoginRes.body.token;

  const driverLoginRes = await request(app)
    .post('/api/login')
    .send({ email: 'driver@example.com', password: 'DriverPass123' });
  driverToken = driverLoginRes.body.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Feature: Admin User Management (ID: 24141113)', () => {

  // TEST 1: Retrieve all users (Positive)
  it('should allow admin to retrieve all users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const emails = res.body.map(u => u.email);
    expect(emails).toContain('admin@example.com');
    expect(emails).toContain('driver@example.com');
  });

  // TEST 2: Toggle ban status (Positive)
  it('should allow admin to toggle user ban status', async () => {
    const toggleRes = await request(app)
      .put(`/api/admin/users/${testUserId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(toggleRes.statusCode).toBe(200);
    expect(toggleRes.body.status).toBe('Banned');

    const toggleBackRes = await request(app)
      .put(`/api/admin/users/${testUserId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(toggleBackRes.statusCode).toBe(200);
    expect(toggleBackRes.body.status).toBe('Active');
  });

  // TEST 3: Ban non-existent user (Negative - 404)
  it('should return 404 when banning a user that does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/admin/users/${fakeId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });

  // TEST 4: Non-admin cannot access admin routes (Security - 403)
  it('should return 403 when a non-admin accesses admin routes', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.statusCode).toBe(403);
  });

  // TEST 5: Missing token returns 401 (Security - 401)
  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

});