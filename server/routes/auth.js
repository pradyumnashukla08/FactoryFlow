const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// ------ REGISTER ------
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").optional().trim(),
    body("factory_name").optional().trim(),
    body("city").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, phone, factory_name, city } = req.body;

      // Check if user exists
      const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "Email already registered." });
      }

      const password_hash = await bcrypt.hash(password, 12);

      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, phone, factory_name, city)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, factory_name, role`,
        [name, email, password_hash, phone, factory_name, city],
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.status(201).json({ user, token });
    } catch (err) {
      next(err);
    }
  },
);

// ------ LOGIN ------
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const result = await db.query(
        "SELECT id, name, email, password_hash, factory_name, role, is_active FROM users WHERE email = $1",
        [email],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const user = result.rows[0];
      if (!user.is_active) {
        return res.status(403).json({ error: "Account deactivated." });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password." });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
      );

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          factory_name: user.factory_name,
          role: user.role,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ------ GET PROFILE ------
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, phone, factory_name, city, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ UPDATE PROFILE ------
router.put("/me", authMiddleware, async (req, res, next) => {
  try {
    const { name, phone, factory_name, city } = req.body;
    const result = await db.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       factory_name = COALESCE($3, factory_name), city = COALESCE($4, city),
       updated_at = CURRENT_TIMESTAMP WHERE id = $5
       RETURNING id, name, email, phone, factory_name, city, role`,
      [name, phone, factory_name, city, req.user.id],
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ------ CHANGE PASSWORD ------
router.put(
  "/password",
  authMiddleware,
  [
    body("current_password").notEmpty().withMessage("Current password is required"),
    body("new_password")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { current_password, new_password } = req.body;

      const userResult = await db.query("SELECT password_hash FROM users WHERE id = $1", [
        req.user.id,
      ]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found." });
      }

      const validPassword = await bcrypt.compare(
        current_password,
        userResult.rows[0].password_hash,
      );
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await db.query(
        "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newHash, req.user.id],
      );

      res.json({ message: "Password changed successfully." });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
