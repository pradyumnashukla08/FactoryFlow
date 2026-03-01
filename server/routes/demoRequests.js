const express = require("express");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");

const router = express.Router();

// ------ SUBMIT DEMO REQUEST (public — no auth) ------
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit Indian mobile number"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("factory_name").optional().trim(),
    body("city").optional().trim(),
    body("billing_range").optional().trim(),
    body("message").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, factory_name, phone, email, city, billing_range, message } =
        req.body;

      const result = await db.query(
        `INSERT INTO demo_requests (name, factory_name, phone, email, city, billing_range, message)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, created_at`,
        [name, factory_name, phone, email, city, billing_range, message],
      );

      res.status(201).json({
        message:
          "Demo request submitted successfully! We will contact you within 24 hours.",
        request: result.rows[0],
      });
    } catch (err) {
      next(err);
    }
  },
);

// ------ LIST DEMO REQUESTS (admin only) ------
router.get("/", async (req, res, next) => {
  // In production, add admin auth middleware here
  try {
    const { status, page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;
    let query = "SELECT * FROM demo_requests";
    const params = [];

    if (status) {
      query += " WHERE status = $1";
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    res.json({ requests: result.rows });
  } catch (err) {
    next(err);
  }
});

// ------ UPDATE DEMO REQUEST STATUS ------
router.patch("/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      "UPDATE demo_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Demo request not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
