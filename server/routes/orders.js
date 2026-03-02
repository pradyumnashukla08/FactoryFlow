const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const { sanitizeFields } = require("../middleware/sanitize");

const router = express.Router();
router.use(authMiddleware);

// Generate unique order number
async function generateOrderNumber(userId) {
  const result = await db.query("SELECT COUNT(*) FROM orders WHERE user_id = $1", [userId]);
  const count = parseInt(result.rows[0].count) + 1;
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  return `ORD-${yy}${mm}-${count.toString().padStart(4, "0")}`;
}

// ------ LIST ORDERS ------
router.get("/", async (req, res, next) => {
  try {
    const { status, customer_id, priority, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, c.name as customer_name, c.company_name
                 FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
                 WHERE o.user_id = $1`;
    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(status);
    }
    if (customer_id) {
      paramCount++;
      query += ` AND o.customer_id = $${paramCount}`;
      params.push(customer_id);
    }
    if (priority) {
      paramCount++;
      query += ` AND o.priority = $${paramCount}`;
      params.push(priority);
    }
    if (search) {
      paramCount++;
      query += ` AND (o.product_name ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count query (same filters, no LIMIT/OFFSET)
    const countQuery = query.replace(
      /SELECT o\.\*, c\.name as customer_name, c\.company_name/i,
      "SELECT COUNT(*)",
    );
    const countParams = [...params];

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams),
    ]);

    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ------ GET SINGLE ORDER ------
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT o.*, c.name as customer_name, c.company_name, c.phone as customer_phone
       FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Get production logs
    const logs = await db.query(
      "SELECT * FROM production_logs WHERE order_id = $1 ORDER BY log_date DESC",
      [req.params.id],
    );

    res.json({ ...result.rows[0], production_logs: logs.rows });
  } catch (err) {
    next(err);
  }
});

// ------ CREATE ORDER ------
router.post(
  "/",
  [
    body("customer_id").isInt().withMessage("Customer is required"),
    body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_id,
        delivery_date,
        priority,
        items,
        total_quantity,
        total_amount,
        tax_amount,
        discount_amount,
        grand_total,
      } = req.body;

      const { notes } = sanitizeFields(req.body, ["notes"]);

      // Verify customer belongs to this user (prevents IDOR)
      if (customer_id) {
        const custCheck = await db.query(
          "SELECT id FROM customers WHERE id = $1 AND user_id = $2",
          [customer_id, req.user.id],
        );
        if (custCheck.rows.length === 0) {
          return res.status(404).json({ error: "Customer not found." });
        }
      }

      const order_number = await generateOrderNumber(req.user.id);

      const result = await db.query(
        `INSERT INTO orders (user_id, customer_id, order_number, delivery_date, priority, items,
         total_quantity, total_amount, tax_amount, discount_amount, grand_total, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [
          req.user.id,
          customer_id,
          order_number,
          delivery_date,
          priority || "normal",
          JSON.stringify(items),
          total_quantity || 0,
          total_amount || 0,
          tax_amount || 0,
          discount_amount || 0,
          grand_total || 0,
          notes,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ------ UPDATE ORDER ------
router.put("/:id", async (req, res, next) => {
  try {
    const {
      customer_id,
      delivery_date,
      status,
      priority,
      items,
      notes,
      total_quantity,
      total_amount,
      tax_amount,
      discount_amount,
      grand_total,
    } = req.body;

    const result = await db.query(
      `UPDATE orders SET
        customer_id = COALESCE($1, customer_id), delivery_date = COALESCE($2, delivery_date),
        status = COALESCE($3, status), priority = COALESCE($4, priority),
        items = COALESCE($5, items), notes = COALESCE($6, notes),
        total_quantity = COALESCE($7, total_quantity), total_amount = COALESCE($8, total_amount),
        tax_amount = COALESCE($9, tax_amount), discount_amount = COALESCE($10, discount_amount),
        grand_total = COALESCE($11, grand_total), updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 AND user_id = $13 RETURNING *`,
      [
        customer_id,
        delivery_date,
        status,
        priority,
        items ? JSON.stringify(items) : null,
        notes,
        total_quantity,
        total_amount,
        tax_amount,
        discount_amount,
        grand_total,
        req.params.id,
        req.user.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ UPDATE ORDER STATUS ------
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "in_production",
      "quality_check",
      "ready",
      "dispatched",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${validStatuses.join(", ")}` });
    }

    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ DELETE ORDER ------
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }
    res.json({ message: "Order deleted successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
