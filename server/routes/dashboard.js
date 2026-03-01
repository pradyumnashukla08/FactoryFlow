const express = require("express");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ------ OWNER DASHBOARD ------
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Run all queries in parallel
    const [
      revenueToday,
      revenueMonth,
      pendingOrders,
      orderStatusCounts,
      unpaidInvoices,
      totalOutstanding,
      recentPayments,
      productionToday,
      monthlyRevenue,
      topCustomers,
    ] = await Promise.all([
      // Today's revenue
      db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments
         WHERE user_id = $1 AND payment_date = CURRENT_DATE`,
        [userId],
      ),

      // This month's revenue
      db.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments
         WHERE user_id = $1 AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [userId],
      ),

      // Pending orders count
      db.query(
        `SELECT COUNT(*) as count FROM orders
         WHERE user_id = $1 AND status NOT IN ('delivered', 'cancelled')`,
        [userId],
      ),

      // Order status distribution
      db.query(
        `SELECT status, COUNT(*) as count FROM orders
         WHERE user_id = $1 GROUP BY status ORDER BY count DESC`,
        [userId],
      ),

      // Unpaid invoices
      db.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total
         FROM invoices WHERE user_id = $1 AND status IN ('unpaid', 'partial', 'overdue')`,
        [userId],
      ),

      // Total outstanding from customers
      db.query(
        `SELECT COALESCE(SUM(outstanding_balance), 0) as total
         FROM customers WHERE user_id = $1 AND is_active = true`,
        [userId],
      ),

      // Recent 5 payments
      db.query(
        `SELECT p.*, c.name as customer_name FROM payments p
         LEFT JOIN customers c ON p.customer_id = c.id
         WHERE p.user_id = $1 ORDER BY p.payment_date DESC LIMIT 5`,
        [userId],
      ),

      // Today's production
      db.query(
        `SELECT COALESCE(SUM(units_produced), 0) as produced,
                COALESCE(SUM(units_defective), 0) as defective
         FROM production_logs WHERE user_id = $1 AND log_date = CURRENT_DATE`,
        [userId],
      ),

      // Monthly revenue (last 6 months)
      db.query(
        `SELECT
          TO_CHAR(payment_date, 'Mon YYYY') as month,
          EXTRACT(MONTH FROM payment_date) as month_num,
          EXTRACT(YEAR FROM payment_date) as year,
          SUM(amount) as revenue
         FROM payments WHERE user_id = $1
         AND payment_date >= CURRENT_DATE - INTERVAL '6 months'
         GROUP BY TO_CHAR(payment_date, 'Mon YYYY'), EXTRACT(MONTH FROM payment_date), EXTRACT(YEAR FROM payment_date)
         ORDER BY year, month_num`,
        [userId],
      ),

      // Top 5 customers by revenue
      db.query(
        `SELECT c.name, c.company_name, COALESCE(SUM(p.amount), 0) as total_paid,
                c.outstanding_balance
         FROM customers c
         LEFT JOIN payments p ON c.id = p.customer_id
         WHERE c.user_id = $1 AND c.is_active = true
         GROUP BY c.id, c.name, c.company_name, c.outstanding_balance
         ORDER BY total_paid DESC LIMIT 5`,
        [userId],
      ),
    ]);

    // Overdue invoices - auto-mark
    await db.query(
      `UPDATE invoices SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND status = 'unpaid' AND due_date < CURRENT_DATE`,
      [userId],
    );

    res.json({
      revenue: {
        today: parseFloat(revenueToday.rows[0].total),
        this_month: parseFloat(revenueMonth.rows[0].total),
        monthly_trend: monthlyRevenue.rows,
      },
      orders: {
        pending_count: parseInt(pendingOrders.rows[0].count),
        status_distribution: orderStatusCounts.rows,
      },
      invoices: {
        unpaid_count: parseInt(unpaidInvoices.rows[0].count),
        unpaid_total: parseFloat(unpaidInvoices.rows[0].total),
      },
      outstanding: parseFloat(totalOutstanding.rows[0].total),
      production_today: productionToday.rows[0],
      recent_payments: recentPayments.rows,
      top_customers: topCustomers.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
