const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const { sanitizeFields } = require("../middleware/sanitize");

const router = express.Router();
router.use(authMiddleware);

// ------ LIST CUSTOMERS ------
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 25, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    let query = `SELECT * FROM customers WHERE user_id = $1 AND is_active = true`;
    const params = [req.user.id];

    if (search) {
      query += ` AND (name ILIKE $2 OR company_name ILIKE $2 OR phone ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM customers WHERE user_id = $1 AND is_active = true`;
    const countParams = [req.user.id];
    if (search) {
      countQuery += ` AND (name ILIKE $2 OR company_name ILIKE $2 OR phone ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      customers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
});

// ------ GET SINGLE CUSTOMER ------
router.get("/:id", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM customers WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.user.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ CREATE CUSTOMER ------
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Customer name is required"),
    body("phone").trim().notEmpty().withMessage("Phone is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, company_name, email, phone, gstin, address, city, state, pincode, notes } =
        sanitizeFields(req.body, ["name", "company_name", "address", "city", "notes"]);

      const result = await db.query(
        `INSERT INTO customers (user_id, name, company_name, email, phone, gstin, address, city, state, pincode, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [
          req.user.id,
          name,
          company_name,
          email,
          phone,
          gstin,
          address,
          city,
          state,
          pincode,
          notes,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

// ------ UPDATE CUSTOMER ------
router.put("/:id", async (req, res, next) => {
  try {
    // Sanitize text fields to prevent stored XSS
    sanitizeFields(req.body, ["name", "company_name", "address", "city", "notes"]);
    const { name, company_name, email, phone, gstin, address, city, state, pincode, notes } =
      req.body;

    const result = await db.query(
      `UPDATE customers SET
        name = COALESCE($1, name), company_name = COALESCE($2, company_name),
        email = COALESCE($3, email), phone = COALESCE($4, phone),
        gstin = COALESCE($5, gstin), address = COALESCE($6, address),
        city = COALESCE($7, city), state = COALESCE($8, state),
        pincode = COALESCE($9, pincode), notes = COALESCE($10, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12 RETURNING *`,
      [
        name,
        company_name,
        email,
        phone,
        gstin,
        address,
        city,
        state,
        pincode,
        notes,
        req.params.id,
        req.user.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ DELETE (SOFT) CUSTOMER ------
router.delete("/:id", async (req, res, next) => {
  try {
    const result = await db.query(
      "UPDATE customers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }
    res.json({ message: "Customer deleted successfully." });
  } catch (err) {
    next(err);
  }
});

// ------ CUSTOMER ORDER HISTORY ------
router.get("/:id/orders", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, order_number, order_date, delivery_date, status, grand_total
       FROM orders WHERE customer_id = $1 AND user_id = $2 ORDER BY order_date DESC`,
      [req.params.id, req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
