const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ------ LIST PAYMENTS ------
router.get("/", async (req, res, next) => {
  try {
    const { customer_id, invoice_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    let query = `SELECT p.*, c.name as customer_name, i.invoice_number
                 FROM payments p
                 LEFT JOIN customers c ON p.customer_id = c.id
                 LEFT JOIN invoices i ON p.invoice_id = i.id
                 WHERE p.user_id = $1`;
    const params = [req.user.id];
    let paramCount = 1;

    if (customer_id) {
      paramCount++;
      query += ` AND p.customer_id = $${paramCount}`;
      params.push(customer_id);
    }
    if (invoice_id) {
      paramCount++;
      query += ` AND p.invoice_id = $${paramCount}`;
      params.push(invoice_id);
    }

    // Count query (same filters, no LIMIT/OFFSET)
    const countQuery = query.replace(
      /SELECT p\.\*, c\.name as customer_name, i\.invoice_number/i,
      "SELECT COUNT(*)",
    );
    const countParams = [...params];

    query += ` ORDER BY p.payment_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      payments: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ------ RECORD PAYMENT ------
router.post(
  "/",
  [
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("customer_id").isInt().withMessage("Customer is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        invoice_id,
        customer_id,
        amount,
        payment_date,
        payment_mode,
        reference_number,
        notes,
      } = req.body;

      // Use transaction to ensure payment, balance, and invoice status are atomic
      const payment = await db.transaction(async (client) => {
        // Verify customer belongs to this user (prevents IDOR)
        const custCheck = await client.query(
          "SELECT id FROM customers WHERE id = $1 AND user_id = $2",
          [customer_id, req.user.id],
        );
        if (custCheck.rows.length === 0) {
          throw Object.assign(new Error("Customer not found."), { statusCode: 404 });
        }

        // Verify invoice belongs to this user (if provided)
        if (invoice_id) {
          const invCheck = await client.query(
            "SELECT id FROM invoices WHERE id = $1 AND user_id = $2",
            [invoice_id, req.user.id],
          );
          if (invCheck.rows.length === 0) {
            throw Object.assign(new Error("Invoice not found."), { statusCode: 404 });
          }
        }

        const result = await client.query(
          `INSERT INTO payments (user_id, invoice_id, customer_id, amount, payment_date, payment_mode, reference_number, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            req.user.id,
            invoice_id,
            customer_id,
            amount,
            payment_date || new Date(),
            payment_mode || "cash",
            reference_number,
            notes,
          ],
        );

        // Update customer outstanding balance
        await client.query(
          "UPDATE customers SET outstanding_balance = outstanding_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [amount, customer_id],
        );

        // Update invoice status if linked
        if (invoice_id) {
          const totalPaid = await client.query(
            "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1",
            [invoice_id],
          );
          const invoice = await client.query("SELECT grand_total FROM invoices WHERE id = $1", [
            invoice_id,
          ]);

          if (invoice.rows.length > 0) {
            const paid = parseFloat(totalPaid.rows[0].paid);
            const total = parseFloat(invoice.rows[0].grand_total);
            const newStatus = paid >= total ? "paid" : "partial";

            await client.query(
              "UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
              [newStatus, invoice_id],
            );
          }
        }

        return result.rows[0];
      });

      res.status(201).json(payment);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      next(err);
    }
  },
);

// ------ DELETE PAYMENT ------
router.delete("/:id", async (req, res, next) => {
  try {
    // Use transaction to ensure deletion, balance restore, and invoice status are atomic
    await db.transaction(async (client) => {
      const payment = await client.query("SELECT * FROM payments WHERE id = $1 AND user_id = $2", [
        req.params.id,
        req.user.id,
      ]);

      if (payment.rows.length === 0) {
        throw Object.assign(new Error("Payment not found."), { statusCode: 404 });
      }

      const { amount, customer_id, invoice_id } = payment.rows[0];

      await client.query("DELETE FROM payments WHERE id = $1", [req.params.id]);

      // Restore customer outstanding balance
      await client.query(
        "UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2",
        [amount, customer_id],
      );

      // Recalculate invoice status
      if (invoice_id) {
        const totalPaid = await client.query(
          "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1",
          [invoice_id],
        );
        const invoice = await client.query("SELECT grand_total FROM invoices WHERE id = $1", [
          invoice_id,
        ]);

        if (invoice.rows.length > 0) {
          const paid = parseFloat(totalPaid.rows[0].paid);
          const newStatus = paid <= 0 ? "unpaid" : "partial";
          await client.query(
            "UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [newStatus, invoice_id],
          );
        }
      }
    });

    res.json({ message: "Payment deleted and balances recalculated." });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

module.exports = router;
