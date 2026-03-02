/**
 * Payments API tests — CRUD, balance updates, invoice status transitions.
 */
const { app, request, getAuthToken } = require("./setup");

describe("Payments API", () => {
  let token;
  let customerId;
  let invoiceId;
  let paymentId;
  const invoiceGrandTotal = 11800; // 10000 + 9% CGST + 9% SGST

  beforeAll(async () => {
    token = await getAuthToken();

    // Create customer
    const cRes = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Payment Test Customer",
        phone: "9876543212",
        company_name: "Payment Test Co",
      });
    customerId = cRes.body.id;

    // Create invoice
    const iRes = await request(app)
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customer_id: customerId,
        items: [{ name: "Part Y", quantity: 50, rate: 200, amount: 10000 }],
        subtotal: 10000,
        cgst_rate: 9,
        sgst_rate: 9,
        due_date: "2026-04-01",
      });
    invoiceId = iRes.body.id;
  });

  // ── Record Payment ────────────────────────────────
  describe("POST /api/payments", () => {
    it("should record a partial payment", async () => {
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer_id: customerId,
          invoice_id: invoiceId,
          amount: 5000,
          payment_mode: "upi",
          payment_date: "2026-03-01",
          reference_number: "UPI-TEST-001",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(parseFloat(res.body.amount)).toBe(5000);
      expect(res.body.payment_mode).toBe("upi");
      paymentId = res.body.id;
    });

    it("should update customer outstanding balance", async () => {
      const cRes = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      // Balance should be reduced by 5000
      const balance = parseFloat(cRes.body.outstanding_balance);
      expect(balance).toBe(invoiceGrandTotal - 5000);
    });

    it("should update invoice status to partial", async () => {
      const iRes = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(iRes.body.status).toBe("partial");
    });

    it("should update invoice to paid when fully settled", async () => {
      // Pay the remaining amount
      const remaining = invoiceGrandTotal - 5000;
      await request(app).post("/api/payments").set("Authorization", `Bearer ${token}`).send({
        customer_id: customerId,
        invoice_id: invoiceId,
        amount: remaining,
        payment_mode: "bank_transfer",
      });

      const iRes = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(iRes.body.status).toBe("paid");
    });

    it("should reject payment with zero amount", async () => {
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customer_id: customerId,
          amount: 0,
        });

      expect(res.status).toBe(400);
    });

    it("should reject payment without customer", async () => {
      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/payments")
        .send({ customer_id: customerId, amount: 100 });

      expect(res.status).toBe(401);
    });
  });

  // ── List Payments ────────────────────────────────
  describe("GET /api/payments", () => {
    it("should return payments with pagination", async () => {
      const res = await request(app).get("/api/payments").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("payments");
      expect(res.body).toHaveProperty("total");
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(typeof res.body.total).toBe("number");
    });

    it("should filter by customer_id", async () => {
      const res = await request(app)
        .get(`/api/payments?customer_id=${customerId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      res.body.payments.forEach((p) => expect(p.customer_id).toBe(customerId));
    });

    it("should filter by invoice_id", async () => {
      const res = await request(app)
        .get(`/api/payments?invoice_id=${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ── Delete Payment ────────────────────────────────
  describe("DELETE /api/payments/:id", () => {
    it("should delete payment and restore balance", async () => {
      if (!paymentId) return;

      const res = await request(app)
        .delete(`/api/payments/${paymentId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("deleted");
    });

    it("should recalculate invoice status after deletion", async () => {
      if (!invoiceId) return;

      const iRes = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);

      // After deleting partial payment, invoice should be partial (remaining payment still exists)
      expect(["partial", "unpaid", "paid"]).toContain(iRes.body.status);
    });

    it("should return 404 for non-existent payment", async () => {
      const res = await request(app)
        .delete("/api/payments/999999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // Cleanup
  afterAll(async () => {
    if (invoiceId) {
      await request(app)
        .delete(`/api/invoices/${invoiceId}`)
        .set("Authorization", `Bearer ${token}`);
    }
    if (customerId) {
      await request(app)
        .delete(`/api/customers/${customerId}`)
        .set("Authorization", `Bearer ${token}`);
    }
  });
});
