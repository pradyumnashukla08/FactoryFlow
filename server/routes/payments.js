const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ------ LIST PAYMENTS ------
router.get("/", async (req, res, next) => {
  try {
    const { customer_id, invoice_id, page = 1, limit = 25 } = req.query;
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

    query += ` ORDER BY p.payment_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({
      payments: result.rows,
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
    body("amount")
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be greater than 0"),
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

      const result = await db.query(
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
      await db.query(
        "UPDATE customers SET outstanding_balance = outstanding_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [amount, customer_id],
      );

      // Update invoice status if linked
      if (invoice_id) {
        const totalPaid = await db.query(
          "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1",
          [invoice_id],
        );
        const invoice = await db.query(
          "SELECT grand_total FROM invoices WHERE id = $1",
          [invoice_id],
        );

        if (invoice.rows.length > 0) {
          const paid = parseFloat(totalPaid.rows[0].paid);
          const total = parseFloat(invoice.rows[0].grand_total);
          const newStatus = paid >= total ? "paid" : "partial";

          await db.query(
            "UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [newStatus, invoice_id],
          );
        }
      }

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ------ DELETE PAYMENT ------
router.delete("/:id", async (req, res, next) => {
  try {
    const payment = await db.query(
      "SELECT * FROM payments WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id],
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: "Payment not found." });
    }

    const { amount, customer_id, invoice_id } = payment.rows[0];

    await db.query("DELETE FROM payments WHERE id = $1", [req.params.id]);

    // Restore customer outstanding balance
    await db.query(
      "UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2",
      [amount, customer_id],
    );

    // Recalculate invoice status
    if (invoice_id) {
      const totalPaid = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = $1",
        [invoice_id],
      );
      const invoice = await db.query(
        "SELECT grand_total FROM invoices WHERE id = $1",
        [invoice_id],
      );

      if (invoice.rows.length > 0) {
        const paid = parseFloat(totalPaid.rows[0].paid);
        const newStatus = paid <= 0 ? "unpaid" : "partial";
        await db.query(
          "UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [newStatus, invoice_id],
        );
      }
    }

    res.json({ message: "Payment deleted and balances recalculated." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
