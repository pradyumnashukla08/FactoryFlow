const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ------ ADD PRODUCTION LOG ------
router.post(
  "/",
  [
    body("order_id").isInt().withMessage("Order ID is required"),
    body("units_produced")
      .isInt({ min: 0 })
      .withMessage("Units produced must be >= 0"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        order_id,
        log_date,
        units_produced,
        units_defective,
        worker_name,
        shift,
        notes,
      } = req.body;

      // Verify order belongs to user
      const order = await db.query(
        "SELECT id FROM orders WHERE id = $1 AND user_id = $2",
        [order_id, req.user.id],
      );
      if (order.rows.length === 0) {
        return res.status(404).json({ error: "Order not found." });
      }

      const result = await db.query(
        `INSERT INTO production_logs (order_id, user_id, log_date, units_produced, units_defective, worker_name, shift, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [
          order_id,
          req.user.id,
          log_date || new Date(),
          units_produced,
          units_defective || 0,
          worker_name,
          shift || "general",
          notes,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ------ GET PRODUCTION LOGS FOR AN ORDER ------
router.get("/order/:orderId", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT pl.*, o.order_number FROM production_logs pl
       JOIN orders o ON pl.order_id = o.id
       WHERE pl.order_id = $1 AND pl.user_id = $2
       ORDER BY pl.log_date DESC`,
      [req.params.orderId, req.user.id],
    );

    // Aggregate stats
    const stats = await db.query(
      `SELECT
        SUM(units_produced) as total_produced,
        SUM(units_defective) as total_defective,
        COUNT(*) as total_logs
       FROM production_logs WHERE order_id = $1 AND user_id = $2`,
      [req.params.orderId, req.user.id],
    );

    res.json({
      logs: result.rows,
      stats: stats.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ------ GET DAILY PRODUCTION SUMMARY ------
router.get("/daily", async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const result = await db.query(
      `SELECT pl.*, o.order_number, c.name as customer_name
       FROM production_logs pl
       JOIN orders o ON pl.order_id = o.id
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE pl.user_id = $1 AND pl.log_date = $2
       ORDER BY pl.created_at DESC`,
      [req.user.id, targetDate],
    );

    const summary = await db.query(
      `SELECT
        SUM(units_produced) as total_produced,
        SUM(units_defective) as total_defective,
        COUNT(DISTINCT order_id) as orders_worked
       FROM production_logs WHERE user_id = $1 AND log_date = $2`,
      [req.user.id, targetDate],
    );

    res.json({
      date: targetDate,
      logs: result.rows,
      summary: summary.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ------ UPDATE PRODUCTION LOG ------
router.put("/:id", async (req, res, next) => {
  try {
    const { units_produced, units_defective, worker_name, shift, notes } =
      req.body;

    const result = await db.query(
      `UPDATE production_logs SET
        units_produced = COALESCE($1, units_produced),
        units_defective = COALESCE($2, units_defective),
        worker_name = COALESCE($3, worker_name),
        shift = COALESCE($4, shift),
        notes = COALESCE($5, notes)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [
        units_produced,
        units_defective,
        worker_name,
        shift,
        notes,
        req.params.id,
        req.user.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Production log not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ DELETE PRODUCTION LOG ------
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "DELETE FROM production_logs WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Production log not found." });
    }
    res.json({ message: "Production log deleted successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
