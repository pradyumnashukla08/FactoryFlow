/**
 * Async route handler wrapper.
 *
 * Wraps an async Express route handler so that rejected promises
 * are automatically passed to next(err). Eliminates the need for
 * try/catch in every route.
 *
 * Usage:
 *   const wrap = require('../middleware/asyncHandler');
 *
 *   router.get('/', wrap(async (req, res) => {
 *     const data = await db.query(...);
 *     res.json(data.rows);
 *   }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
