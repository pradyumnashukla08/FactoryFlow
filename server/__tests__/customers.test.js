/**
 * Customer API tests — CRUD operations and data isolation.
 */
const { app, request, getAuthToken } = require("./setup");

describe("Customer API", () => {
  let token;
  let customerId;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  // ── Create Customer ────────────────────────────────
  describe("POST /api/customers", () => {
    it("should create a customer", async () => {
      const res = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Customer",
          company_name: "Test Co",
          email: "customer@test.com",
          phone: "9876543210",
          city: "Delhi",
          gstin: "22AAAAA0000A1Z5",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Test Customer");
      customerId = res.body.id;
    });

    it("should reject customer without name", async () => {
      const res = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "noname@test.com" });

      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).post("/api/customers").send({ name: "Unauth" });

      expect(res.status).toBe(401);
    });
  });

  // ── List Customers ────────────────────────────────
  describe("GET /api/customers", () => {
    it("should return customer list", async () => {
      const res = await request(app).get("/api/customers").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.customers || res.body)).toBe(true);
    });

    it("should support search parameter", async () => {
      const res = await request(app)
        .get("/api/customers?search=Test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ── Get Single Customer ────────────────────────────────
  describe("GET /api/customers/:id", () => {
    it("should return customer by id", async () => {
      if (!customerId) return;

      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(customerId);
    });

    it("should return 404 for non-existent id", async () => {
      const res = await request(app)
        .get("/api/customers/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update Customer ────────────────────────────────
  describe("PUT /api/customers/:id", () => {
    it("should update customer", async () => {
      if (!customerId) return;

      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Customer", city: "Mumbai" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Customer");
      expect(res.body.city).toBe("Mumbai");
    });
  });

  // ── Delete Customer ────────────────────────────────
  describe("DELETE /api/customers/:id", () => {
    it("should delete customer", async () => {
      if (!customerId) return;

      const res = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect([200, 204]).toContain(res.status);
    });

    it("should return 404 after deletion", async () => {
      if (!customerId) return;

      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
