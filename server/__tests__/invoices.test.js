/**
 * Invoices API tests — CRUD, GST calculation, transaction integrity.
 */
const { app, request, getAuthToken } = require("./setup");

describe("Invoices API", () => {
  let token;
  let customerId;
  let orderId;
  let invoiceId;

  beforeAll(async () => {
    token = await getAuthToken();

    // Create customer
    const cRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Invoice Test Customer",
        phone: "9876543211",
        company_name: "Invoice Test Co",
        gstin: "22BBBBB0000B1Z5",
      });
    customerId = cRes.body.id;

    // Create an order
    const oRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer_id: customerId,
        items: [{ name: "Part X", quantity: 50, rate: 200 }],
        total_quantity: 50,
        total_amount: 10000,
        grand_total: 10000,
      });
    orderId = oRes.body.id;
  });

  // ── Create Invoice ────────────────────────────────
  describe("POST /api/invoices", () => {
    it("should create invoice with GST calculation", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer_id: customerId,
          order_id: orderId,
          items: [{ name: "Part X", quantity: 50, rate: 200, amount: 10000 }],
          subtotal: 10000,
          cgst_rate: 9,
          sgst_rate: 9,
          due_date: "2026-04-01",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("invoice_number");
      expect(res.body.status).toBe("unpaid");
      expect(parseFloat(res.body.cgst_amount)).toBe(900);
      expect(parseFloat(res.body.sgst_amount)).toBe(900);
      expect(parseFloat(res.body.grand_total)).toBe(11800);
      invoiceId = res.body.id;
    });

    it("should update customer outstanding balance on creation", async () => {
      const cRes = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(parseFloat(cRes.body.outstanding_balance)).toBe(11800);
    });

    it("should reject invoice without items", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({ customer_id: customerId, items: [], subtotal: 0 });

      expect(res.status).toBe(400);
    });

    it("should reject invoice without customer", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ name: "X", quantity: 1, rate: 100, amount: 100 }],
          subtotal: 100,
        });

      expect(res.status).toBe(400);
    });
  });

  // ── List Invoices ────────────────────────────────
  describe("GET /api/invoices", () => {
    it("should return invoices with pagination", async () => {
      const res = await request(app).get("/api/invoices").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("invoices");
      expect(res.body).toHaveProperty("total");
      expect(Array.isArray(res.body.invoices)).toBe(true);
      expect(typeof res.body.total).toBe("number");
    });

    it("should filter by status", async () => {
      const res = await request(app)
        .get("/api/invoices?status=unpaid")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.invoices.forEach((inv) => expect(inv.status).toBe("unpaid"));
    });
  });

  // ── Get Single Invoice ────────────────────────────────
  describe("GET /api/invoices/:id", () => {
    it("should return invoice with customer details and payments", async () => {
      if (!invoiceId) return;
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(invoiceId);
      expect(res.body).toHaveProperty("customer_name");
      expect(res.body).toHaveProperty("payments");
    });

    it("should return 404 for non-existent invoice", async () => {
      const res = await request(app)
        .get("/api/invoices/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Update Invoice Status ────────────────────────────────
  describe("PATCH /api/invoices/:id/status", () => {
    it("should update invoice status", async () => {
      if (!invoiceId) return;
      const res = await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "overdue" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("overdue");
    });

    it("should reject invalid status", async () => {
      if (!invoiceId) return;
      const res = await request(app)
        .patch(`/api/invoices/${invoiceId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "invalid" });

      expect(res.status).toBe(400);
    });
  });

  // ── Delete Invoice ────────────────────────────────
  describe("DELETE /api/invoices/:id", () => {
    it("should delete invoice and adjust customer balance", async () => {
      if (!invoiceId) return;

      const res = await request(app)
        .delete(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify balance was restored
      const cRes = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      // Balance should be back to 0 (or close) since we deleted the only invoice
      expect(parseFloat(cRes.body.outstanding_balance)).toBeLessThanOrEqual(0);
    });

    it("should return 404 after deletion", async () => {
      if (!invoiceId) return;
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // Cleanup
  afterAll(async () => {
    if (orderId) {
      await request(app).delete(`/api/orders/${orderId}`).set("Authorization", `Bearer ${token}`);
    }
    if (customerId) {
      await request(app)
        .delete(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
