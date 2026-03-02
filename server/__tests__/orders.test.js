/**
 * Orders API tests — CRUD, status transitions, pagination.
 */
const { app, request, getAuthToken } = require("./setup");

describe("Orders API", () => {
  let token;
  let customerId;
  let orderId;

  beforeAll(async () => {
    token = await getAuthToken();

    // Create a test customer for orders
    const cRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Order Test Customer",
        phone: "9876543210",
        company_name: "Order Test Co",
      });
    customerId = cRes.body.id;
  });

  // ── Create Order ────────────────────────────────
  describe("POST /api/orders", () => {
    it("should create an order", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer_id: customerId,
          items: [{ name: "Widget A", quantity: 100, rate: 50 }],
          total_quantity: 100,
          total_amount: 5000,
          grand_total: 5000,
          priority: "normal",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("order_number");
      expect(res.body.status).toBe("pending");
      orderId = res.body.id;
    });

    it("should reject order without items", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ customer_id: customerId, items: [] });

      expect(res.status).toBe(400);
    });

    it("should reject order without customer", async () => {
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ name: "Widget", quantity: 1 }] });

      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ customer_id: customerId, items: [{ name: "X" }] });

      expect(res.status).toBe(401);
    });
  });

  // ── List Orders ────────────────────────────────
  describe("GET /api/orders", () => {
    it("should return orders with pagination", async () => {
      const res = await request(app).get("/api/orders").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("orders");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("page");
      expect(res.body).toHaveProperty("limit");
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(typeof res.body.total).toBe("number");
    });

    it("should filter by status", async () => {
      const res = await request(app)
        .get("/api/orders?status=pending")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.orders.forEach((o) => expect(o.status).toBe("pending"));
    });

    it("should filter by customer_id", async () => {
      const res = await request(app)
        .get(`/api/orders?customer_id=${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("should support pagination params", async () => {
      const res = await request(app)
        .get("/api/orders?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });
  });

  // ── Get Single Order ────────────────────────────────
  describe("GET /api/orders/:id", () => {
    it("should return order by id", async () => {
      if (!orderId) return;
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body).toHaveProperty("production_logs");
    });

    it("should return 404 for non-existent order", async () => {
      const res = await request(app)
        .get("/api/orders/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update Order Status ────────────────────────────────
  describe("PATCH /api/orders/:id/status", () => {
    it("should update order status", async () => {
      if (!orderId) return;
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "confirmed" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("confirmed");
    });

    it("should reject invalid status", async () => {
      if (!orderId) return;
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "invalid_status" });

      expect(res.status).toBe(400);
    });
  });

  // ── Update Order ────────────────────────────────
  describe("PUT /api/orders/:id", () => {
    it("should update order fields", async () => {
      if (!orderId) return;
      const res = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ priority: "high", notes: "Updated via test" });

      expect(res.status).toBe(200);
      expect(res.body.priority).toBe("high");
    });
  });

  // ── Delete Order ────────────────────────────────
  describe("DELETE /api/orders/:id", () => {
    it("should delete order", async () => {
      if (!orderId) return;
      const res = await request(app)
        .delete(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted");
    });

    it("should return 404 after deletion", async () => {
      if (!orderId) return;
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // Cleanup
  afterAll(async () => {
    if (customerId) {
      await request(app)
        .delete(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
