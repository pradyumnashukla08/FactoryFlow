const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// Generate invoice number
async function generateInvoiceNumber(userId) {
  const result = await db.query("SELECT COUNT(*) FROM invoices WHERE user_id = $1", [userId]);
  const count = parseInt(result.rows[0].count) + 1;
  const date = new Date();
  const fy =
    date.getMonth() >= 3
      ? `${date.getFullYear().toString().slice(-2)}${(date.getFullYear() + 1).toString().slice(-2)}`
      : `${(date.getFullYear() - 1).toString().slice(-2)}${date.getFullYear().toString().slice(-2)}`;
  return `INV-${fy}-${count.toString().padStart(4, "0")}`;
}

// ------ LIST INVOICES ------
router.get("/", async (req, res, next) => {
  try {
    const { status, customer_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    let query = `SELECT i.*, c.name as customer_name, c.company_name, c.gstin as customer_gstin
                 FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
                 WHERE i.user_id = $1`;
    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }
    if (customer_id) {
      paramCount++;
      query += ` AND i.customer_id = $${paramCount}`;
      params.push(customer_id);
    }

    // Count query (same filters, no LIMIT/OFFSET)
    const countQuery = query.replace(
      /SELECT i\.\*, c\.name as customer_name, c\.company_name, c\.gstin as customer_gstin/i,
      "SELECT COUNT(*)",
    );
    const countParams = [...params];

    query += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ------ GET SINGLE INVOICE ------
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.*, c.name as customer_name, c.company_name, c.gstin as customer_gstin,
              c.address as customer_address, c.city as customer_city, c.state as customer_state,
              c.phone as customer_phone, c.email as customer_email
       FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
       WHERE i.id = $1 AND i.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found." });
    }

    // Get associated payments (scoped to this user to prevent IDOR)
    const payments = await db.query(
      "SELECT * FROM payments WHERE invoice_id = $1 AND user_id = $2 ORDER BY payment_date DESC",
      [req.params.id, req.user.id],
    );

    res.json({ ...result.rows[0], payments: payments.rows });
  } catch (err) {
    next(err);
  }
});

// ------ CREATE INVOICE ------
router.post(
  "/",
  [
    body("customer_id").isInt().withMessage("Customer is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
    body("subtotal").isFloat({ min: 0 }).withMessage("Subtotal is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_id,
        order_id,
        due_date,
        items,
        subtotal,
        cgst_rate,
        sgst_rate,
        igst_rate,
        notes,
      } = req.body;

      const invoice_number = await generateInvoiceNumber(req.user.id);

      // Calculate GST
      const cgst = cgst_rate ? (subtotal * cgst_rate) / 100 : (subtotal * 9) / 100;
      const sgst = sgst_rate ? (subtotal * sgst_rate) / 100 : (subtotal * 9) / 100;
      const igst = igst_rate ? (subtotal * igst_rate) / 100 : 0;
      const total_tax = cgst + sgst + igst;
      const grand_total = subtotal + total_tax;

      // Use transaction to ensure invoice creation and balance update are atomic
      const invoice = await db.transaction(async (client) => {
        // Verify customer belongs to this user (prevents IDOR)
        const custCheck = await client.query(
          "SELECT id FROM customers WHERE id = $1 AND user_id = $2",
          [customer_id, req.user.id],
        );
        if (custCheck.rows.length === 0) {
          throw Object.assign(new Error("Customer not found."), { statusCode: 404 });
        }

        const result = await client.query(
          `INSERT INTO invoices (user_id, customer_id, order_id, invoice_number, due_date,
           subtotal, cgst_rate, sgst_rate, igst_rate, cgst_amount, sgst_amount, igst_amount,
           total_tax, grand_total, items, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
          [
            req.user.id,
            customer_id,
            order_id,
            invoice_number,
            due_date,
            subtotal,
            cgst_rate || 9,
            sgst_rate || 9,
            igst_rate || 0,
            cgst,
            sgst,
            igst,
            total_tax,
            grand_total,
            JSON.stringify(items),
            notes,
          ],
        );

        // Update customer outstanding balance
        await client.query(
          "UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2",
          [grand_total, customer_id],
        );

        return result.rows[0];
      });

      res.status(201).json(invoice);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      next(err);
    }
  },
);

// ------ UPDATE INVOICE STATUS ------
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["unpaid", "partial", "paid", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const result = await db.query(
      `UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ DELETE INVOICE ------
router.delete("/:id", async (req, res, next) => {
  try {
    // Use transaction to ensure balance adjustment and deletion are atomic
    await db.transaction(async (client) => {
      // Get invoice total to adjust customer balance
      const invoice = await client.query(
        "SELECT grand_total, customer_id, status FROM invoices WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.id],
      );

      if (invoice.rows.length === 0) {
        throw Object.assign(new Error("Invoice not found."), { statusCode: 404 });
      }

      if (invoice.rows[0].status !== "paid") {
        await client.query(
          "UPDATE customers SET outstanding_balance = outstanding_balance - $1 WHERE id = $2",
          [invoice.rows[0].grand_total, invoice.rows[0].customer_id],
        );
      }

      await client.query("DELETE FROM invoices WHERE id = $1 AND user_id = $2", [
        req.params.id,
        req.user.id,
      ]);
    });

    res.json({ message: "Invoice deleted successfully." });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
