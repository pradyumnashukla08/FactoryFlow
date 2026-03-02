const jwt = require("jsonwebtoken");
const db = require("../config/db");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user is still active (prevents deactivated users from using stale tokens)
    const userCheck = await db.query("SELECT is_active FROM users WHERE id = $1", [decoded.id]);
    if (!userCheck.rows[0]?.is_active) {
      return res.status(403).json({ error: "Account deactivated." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
    next(err);
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Token invalid, but that's okay for optional auth
    }
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
