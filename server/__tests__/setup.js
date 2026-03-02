/**
 * Test setup — provides helpers for authentication and database cleanup.
 *
 * IMPORTANT: These tests require a running PostgreSQL instance.
 * Set the DB_* env vars (or use a .env.test) pointing to a TEST database.
 * The test database should be separate from your development database.
 */
const request = require("supertest");

// Load env before anything else
require("dotenv").config();
const app = require("../index");

let authToken = null;
let testUserId = null;

const TEST_USER = {
  name: "Test User",
  email: `testuser_${Date.now()}@factoryflow.test`,
  password: "Test@1234",
  factory_name: "Test Factory",
  city: "Mumbai",
};

/**
 * Register a test user and return the auth token.
 */
async function getAuthToken() {
  if (authToken) return authToken;

  const res = await request(app).post("/api/auth/register").send(TEST_USER);

  if (res.status === 201) {
    authToken = res.body.token;
    testUserId = res.body.user.id;
    return authToken;
  }

  // If user already exists, login instead
  const loginRes = await request(app).post("/api/auth/login").send({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  authToken = loginRes.body.token;
  testUserId = loginRes.body.user.id;
  return authToken;
}

/**
 * Helper to make authenticated requests.
 */
function authRequest(method, url) {
  return request(app)[method](url).set("Authorization", `Bearer ${authToken}`);
}

module.exports = {
  app,
  request,
  getAuthToken,
  authRequest,
  TEST_USER,
  getTestUserId: () => testUserId,
};
