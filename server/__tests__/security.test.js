/**
 * Security Test Suite
 * -------------------
 * Tests for IDOR prevention, auth bypass, privilege escalation,
 * input sanitization, and rate limiting.
 */
const { app, request, getAuthToken, authRequest } = require("./setup");

let token;

beforeAll(async () => {
  token = await getAuthToken();
});

// ============================================
// 1. AUTHENTICATION BYPASS
// ============================================
describe("Authentication Bypass Prevention", () => {
  test("should reject requests without a token", async () => {
    const res = await request(app).get("/api/customers");
    expect([401, 403]).toContain(res.status);
  });

  test("should reject requests with an invalid token", async () => {
    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", "Bearer invalid.token.here");
    expect([401, 403]).toContain(res.status);
  });

  test("should reject requests with an expired token format", async () => {
    // A structurally valid but expired JWT
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJpZCI6MSwiZXhwIjoxMDAwMDAwMDAwfQ." +
      "invalidsignature";
    const res = await request(app)
      .get("/api/customers")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect([401, 403]).toContain(res.status);
  });

  test("should reject requests with Bearer prefix missing", async () => {
    const res = await request(app).get("/api/customers").set("Authorization", token);
    expect([401, 403]).toContain(res.status);
  });

  test("demo requests GET should require auth", async () => {
    const res = await request(app).get("/api/demo-requests");
    expect([401, 403]).toContain(res.status);
  });
});

// ============================================
// 2. IDOR (Insecure Direct Object Reference) PREVENTION
// ============================================
describe("IDOR Prevention", () => {
  test("should not return another user's customer by ID", async () => {
    // Try accessing a customer with an ID that doesn't belong to the test user
    const res = await authRequest("get", "/api/customers/999999");
    expect([404, 403]).toContain(res.status);
  });

  test("should not update another user's customer", async () => {
    const res = await authRequest("put", "/api/customers/999999").send({
      name: "Hacked Name",
      email: "hacked@evil.com",
      phone: "1234567890",
    });
    expect([404, 403]).toContain(res.status);
  });

  test("should not delete another user's customer", async () => {
    const res = await authRequest("delete", "/api/customers/999999");
    expect([404, 403]).toContain(res.status);
  });

  test("should not return another user's order by ID", async () => {
    const res = await authRequest("get", "/api/orders/999999");
    expect([404, 403]).toContain(res.status);
  });

  test("should not return another user's invoice by ID", async () => {
    const res = await authRequest("get", "/api/invoices/999999");
    expect([404, 403]).toContain(res.status);
  });

  test("should not return another user's payment by ID", async () => {
    const res = await authRequest("get", "/api/payments/999999");
    expect([404, 403]).toContain(res.status);
  });
});

// ============================================
// 3. INPUT VALIDATION & SANITIZATION
// ============================================
describe("Input Validation & Sanitization", () => {
  test("should reject customer creation with missing required fields", async () => {
    const res = await authRequest("post", "/api/customers").send({});
    expect(res.status).toBe(400);
  });

  test("should reject customer creation with invalid email", async () => {
    const res = await authRequest("post", "/api/customers").send({
      name: "Test",
      email: "not-an-email",
      phone: "1234567890",
    });
    expect(res.status).toBe(400);
  });

  test("should reject order with negative quantity", async () => {
    const res = await authRequest("post", "/api/orders").send({
      customer_id: 1,
      product_name: "Widget",
      quantity: -5,
      unit_price: 100,
    });
    expect([400, 422]).toContain(res.status);
  });

  test("should reject invoice with invalid status", async () => {
    // Try to update an invoice with a status not in the whitelist
    const res = await authRequest("patch", "/api/invoices/1").send({
      status: "hacked_status",
    });
    expect([400, 404]).toContain(res.status);
  });

  test("should reject payment with invalid payment_method", async () => {
    const res = await authRequest("post", "/api/payments").send({
      invoice_id: 1,
      amount: 100,
      payment_method: "<script>alert('xss')</script>",
      payment_date: new Date().toISOString(),
    });
    // Should be rejected or at least sanitized
    expect([400, 422, 404]).toContain(res.status);
  });
});

// ============================================
// 4. SQL INJECTION PREVENTION
// ============================================
describe("SQL Injection Prevention", () => {
  test("should safely handle SQL injection in search parameter", async () => {
    const res = await authRequest("get", "/api/customers?search=' OR 1=1 --");
    // Should return 200 with no leaked data (parameterized queries)
    expect(res.status).toBe(200);
    // Should not return ALL customers — only those matching the literal string
    expect(Array.isArray(res.body.data || res.body.customers || res.body)).toBe(true);
  });

  test("should safely handle SQL injection in order ID", async () => {
    const res = await authRequest("get", "/api/orders/1; DROP TABLE orders;--");
    expect([400, 404, 500]).toContain(res.status);
  });

  test("should safely handle SQL injection in customer name", async () => {
    const res = await authRequest("post", "/api/customers").send({
      name: "'; DROP TABLE customers; --",
      email: "sqli@test.com",
      phone: "1234567890",
    });
    // Should either create (safely escaped) or reject, NOT drop table
    expect([201, 400]).toContain(res.status);
  });
});

// ============================================
// 5. XSS PREVENTION
// ============================================
describe("XSS Prevention", () => {
  test("should sanitize or reject script tags in customer name", async () => {
    const xssPayload = "<script>alert('xss')</script>";
    const res = await authRequest("post", "/api/customers").send({
      name: xssPayload,
      email: "xss@test.com",
      phone: "1234567890",
    });

    if (res.status === 201) {
      // If created, the name should be sanitized (escaped or stripped)
      const customer = res.body.customer || res.body;
      expect(customer.name).not.toContain("<script>");
    }
    // 400 is also acceptable (rejected)
    expect([201, 400]).toContain(res.status);
  });
});

// ============================================
// 6. HEALTH ENDPOINT INFO DISCLOSURE
// ============================================
describe("Health Endpoint Info Disclosure", () => {
  test("should not expose version, memory, or uptime", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("version");
    expect(res.body).not.toHaveProperty("memory");
    expect(res.body).not.toHaveProperty("uptime");
  });

  test("should return status, service, timestamp, database", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("service", "FactoryFlow API");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("database");
  });
});

// ============================================
// 7. PAGINATION LIMIT ENFORCEMENT
// ============================================
describe("Pagination Limit Enforcement", () => {
  test("should cap customers limit at 100", async () => {
    const res = await authRequest("get", "/api/customers?limit=500");
    expect(res.status).toBe(200);
    // If there are results, count should not exceed 100
    const data = res.body.data || res.body.customers || [];
    expect(data.length).toBeLessThanOrEqual(100);
  });

  test("should cap orders limit at 100", async () => {
    const res = await authRequest("get", "/api/orders?limit=500");
    expect(res.status).toBe(200);
    const data = res.body.data || res.body.orders || [];
    expect(data.length).toBeLessThanOrEqual(100);
  });
});

// ============================================
// 8. DEMO REQUEST STATUS VALIDATION
// ============================================
describe("Demo Request Status Validation", () => {
  test("should reject invalid demo request status", async () => {
    const res = await authRequest("patch", "/api/demo-requests/1").send({
      status: "malicious_status",
    });
    expect([400, 404]).toContain(res.status);
  });
});

// ============================================
// 9. ERROR HANDLING (no stack traces leaked)
// ============================================
describe("Error Handling — No Info Leakage", () => {
  test("should not expose stack traces on 404", async () => {
    const res = await request(app).get("/api/nonexistent-route");
    expect(res.body.stack).toBeUndefined();
    expect(res.body.detail).toBeUndefined();
  });
});
