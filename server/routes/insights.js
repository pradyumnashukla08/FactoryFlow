const express = require("express");
const db = require("../config/db");
const { authMiddleware } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
router.use(authMiddleware);

// ──────── Gemini AI Helper ────────
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

async function getGeminiInsights(metricsContext) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are an expert factory management AI consultant for Indian manufacturing businesses.
Analyze the following factory performance data and provide 4-6 actionable business insights.

FACTORY DATA:
${JSON.stringify(metricsContext, null, 2)}

Respond ONLY with a valid JSON array (no markdown, no code blocks) where each object has:
- "type": one of "success", "warning", "error", "info"  
- "category": one of "Revenue", "Production", "Orders", "Payments", "Invoices", "Strategy"
- "title": short title (max 6 words)
- "message": detailed insight (2-3 sentences, actionable, specific to the numbers)
- "metric": the key number referenced (e.g. "₹4.2L", "92%", "15 days")
- "icon": one of "trending_up", "trending_down", "trending_flat", "warning", "verified", "account_balance", "inventory", "schedule", "speed", "lightbulb", "star", "analytics"

Be specific with numbers from the data. Include at least one strategic/forward-looking insight.
Use Indian currency format (₹, L for lakhs, Cr for crores).
Focus on actionable recommendations a factory owner can implement immediately.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fence if present
    let jsonStr = text;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        type: item.type || "info",
        category: item.category || "Strategy",
        title: item.title || "AI Insight",
        message: item.message || "",
        metric: item.metric || "",
        icon: item.icon || "lightbulb",
        ai_generated: true,
      }));
    }
    return null;
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return null;
  }
}

// ──────── AI INSIGHTS ENGINE ────────
// Analyzes factory data and generates smart business insights

router.get("/", async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      revenueStats,
      orderStats,
      productionStats,
      customerStats,
      paymentStats,
      monthlyPerformance,
      weeklyTrend,
      customerRevenue,
      ordersByPriority,
      productionQuality,
      invoiceAging,
      paymentModes,
    ] = await Promise.all([
      // Revenue: this month vs last month
      db.query(
        `SELECT
          COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            THEN amount ELSE 0 END), 0) as current_month,
          COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
            AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            THEN amount ELSE 0 END), 0) as last_month,
          COALESCE(SUM(amount), 0) as total_all_time
        FROM payments WHERE user_id = $1`,
        [userId],
      ),

      // Order completion rates
      db.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
          COUNT(*) FILTER (WHERE status IN ('pending','confirmed')) as backlog,
          COUNT(*) FILTER (WHERE status = 'in_production') as in_production,
          AVG(CASE WHEN status = 'delivered' 
            THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0 
            ELSE NULL END) as avg_delivery_days
        FROM orders WHERE user_id = $1`,
        [userId],
      ),

      // Production efficiency (last 30 days)
      db.query(
        `SELECT
          COALESCE(SUM(units_produced), 0) as total_produced,
          COALESCE(SUM(units_defective), 0) as total_defective,
          COUNT(DISTINCT log_date) as active_days,
          COALESCE(AVG(units_produced), 0) as avg_daily_output,
          COALESCE(MAX(units_produced), 0) as peak_output,
          COALESCE(MIN(units_produced), 0) as min_output
        FROM production_logs 
        WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '30 days'`,
        [userId],
      ),

      // Customer insights
      db.query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COALESCE(SUM(outstanding_balance), 0) as total_outstanding,
          COALESCE(AVG(outstanding_balance), 0) as avg_outstanding,
          COALESCE(MAX(outstanding_balance), 0) as max_outstanding
        FROM customers WHERE user_id = $1`,
        [userId],
      ),

      // Payment collection rate (this month)
      db.query(
        `SELECT
          COALESCE((SELECT SUM(amount) FROM payments 
            WHERE user_id = $1 
            AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as collected,
          COALESCE((SELECT SUM(grand_total) FROM invoices 
            WHERE user_id = $1 
            AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as invoiced`,
        [userId],
      ),

      // Monthly performance (last 12 months)
      db.query(
        `SELECT
          TO_CHAR(m.month, 'Mon YY') as label,
          COALESCE(orders.count, 0) as orders,
          COALESCE(invoices.total, 0) as invoiced,
          COALESCE(payments.total, 0) as collected,
          COALESCE(production.units, 0) as produced
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'
        ) m(month)
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as count FROM orders 
          WHERE user_id = $1 AND DATE_TRUNC('month', created_at) = m.month
        ) orders ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices
          WHERE user_id = $1 AND DATE_TRUNC('month', invoice_date) = m.month
        ) invoices ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(amount), 0) as total FROM payments
          WHERE user_id = $1 AND DATE_TRUNC('month', payment_date) = m.month
        ) payments ON true
        LEFT JOIN LATERAL (
          SELECT COALESCE(SUM(units_produced), 0) as units FROM production_logs
          WHERE user_id = $1 AND DATE_TRUNC('month', log_date) = m.month
        ) production ON true
        ORDER BY m.month`,
        [userId],
      ),

      // Weekly order trend (last 8 weeks)
      db.query(
        `SELECT
          TO_CHAR(DATE_TRUNC('week', created_at), 'DD Mon') as week,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as value
        FROM orders
        WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY DATE_TRUNC('week', created_at)`,
        [userId],
      ),

      // Revenue by customer (top 8)
      db.query(
        `SELECT c.name, c.company_name, 
          COALESCE(SUM(p.amount), 0) as revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM customers c
        LEFT JOIN payments p ON c.id = p.customer_id
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE c.user_id = $1 AND c.is_active = true
        GROUP BY c.id, c.name, c.company_name
        HAVING COALESCE(SUM(p.amount), 0) > 0
        ORDER BY revenue DESC LIMIT 8`,
        [userId],
      ),

      // Orders by priority
      db.query(
        `SELECT 
          priority, COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as value
        FROM orders WHERE user_id = $1
        GROUP BY priority ORDER BY count DESC`,
        [userId],
      ),

      // Production quality by shift
      db.query(
        `SELECT
          COALESCE(shift, 'day') as shift,
          COALESCE(SUM(units_produced), 0) as produced,
          COALESCE(SUM(units_defective), 0) as defective
        FROM production_logs
        WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY shift`,
        [userId],
      ),

      // Invoice aging
      db.query(
        `SELECT
          COUNT(*) FILTER (WHERE due_date >= CURRENT_DATE) as current_count,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND due_date >= CURRENT_DATE - INTERVAL '30 days') as overdue_30,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - INTERVAL '30 days' AND due_date >= CURRENT_DATE - INTERVAL '60 days') as overdue_60,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE - INTERVAL '60 days') as overdue_90_plus,
          COALESCE(SUM(grand_total) FILTER (WHERE status IN ('unpaid','partial','overdue')), 0) as total_unpaid
        FROM invoices WHERE user_id = $1 AND status NOT IN ('paid', 'cancelled')`,
        [userId],
      ),

      // Payment mode distribution
      db.query(
        `SELECT payment_mode, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM payments WHERE user_id = $1
        GROUP BY payment_mode ORDER BY total DESC`,
        [userId],
      ),
    ]);

    // ── Generate AI Insights ──
    const rev = revenueStats.rows[0];
    const ord = orderStats.rows[0];
    const prod = productionStats.rows[0];
    const cust = customerStats.rows[0];
    const pay = paymentStats.rows[0];
    const aging = invoiceAging.rows[0];

    const currentMonth = parseFloat(rev.current_month);
    const lastMonth = parseFloat(rev.last_month);
    const revenueGrowth =
      lastMonth > 0
        ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1)
        : currentMonth > 0
          ? 100
          : 0;

    const totalProduced = parseInt(prod.total_produced);
    const totalDefective = parseInt(prod.total_defective);
    const qualityRate =
      totalProduced > 0
        ? (((totalProduced - totalDefective) / totalProduced) * 100).toFixed(1)
        : 100;

    const deliveredCount = parseInt(ord.delivered);
    const totalOrders = parseInt(ord.total);
    const completionRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : 0;

    const collectionRate =
      parseFloat(pay.invoiced) > 0
        ? ((parseFloat(pay.collected) / parseFloat(pay.invoiced)) * 100).toFixed(1)
        : 0;

    // Score calculation (0-100)
    const revenueScore = Math.min(100, Math.max(0, 50 + parseFloat(revenueGrowth)));
    const qualityScore = parseFloat(qualityRate);
    const completionScore = parseFloat(completionRate);
    const collectionScore = parseFloat(collectionRate);
    const overallScore = Math.round(
      revenueScore * 0.3 + qualityScore * 0.25 + completionScore * 0.25 + collectionScore * 0.2,
    );

    // Generate smart insights
    const insights = [];

    // Revenue insight
    if (parseFloat(revenueGrowth) > 10) {
      insights.push({
        type: "success",
        category: "Revenue",
        title: "Revenue Growing Strong",
        message: `Revenue is up ${revenueGrowth}% vs last month. Keep this momentum going!`,
        metric: `${revenueGrowth}%`,
        icon: "trending_up",
      });
    } else if (parseFloat(revenueGrowth) < -10) {
      insights.push({
        type: "warning",
        category: "Revenue",
        title: "Revenue Declining",
        message: `Revenue dropped ${Math.abs(revenueGrowth)}% vs last month. Consider follow-up on pending invoices.`,
        metric: `${revenueGrowth}%`,
        icon: "trending_down",
      });
    } else {
      insights.push({
        type: "info",
        category: "Revenue",
        title: "Revenue Stable",
        message: `Revenue is steady with ${revenueGrowth}% change vs last month.`,
        metric: `${revenueGrowth}%`,
        icon: "trending_flat",
      });
    }

    // Quality insight
    if (parseFloat(qualityRate) < 95) {
      insights.push({
        type: "warning",
        category: "Production",
        title: "Quality Needs Attention",
        message: `Quality rate is ${qualityRate}%. ${totalDefective} defective units in the last 30 days. Investigate root causes.`,
        metric: `${qualityRate}%`,
        icon: "warning",
      });
    } else {
      insights.push({
        type: "success",
        category: "Production",
        title: "Excellent Quality",
        message: `Quality rate at ${qualityRate}% — your production line is running efficiently.`,
        metric: `${qualityRate}%`,
        icon: "verified",
      });
    }

    // Outstanding payment insight
    const totalOutstanding = parseFloat(cust.total_outstanding);
    if (totalOutstanding > 0) {
      const highRiskCustomer = parseFloat(cust.max_outstanding);
      insights.push({
        type: totalOutstanding > 500000 ? "error" : "warning",
        category: "Payments",
        title: "Outstanding Receivables",
        message: `₹${(totalOutstanding / 100000).toFixed(1)}L outstanding. Highest single customer: ₹${(highRiskCustomer / 1000).toFixed(0)}K.`,
        metric: `₹${(totalOutstanding / 100000).toFixed(1)}L`,
        icon: "account_balance",
      });
    }

    // Order backlog insight
    const backlog = parseInt(ord.backlog);
    if (backlog > 10) {
      insights.push({
        type: "warning",
        category: "Orders",
        title: "High Order Backlog",
        message: `${backlog} orders waiting to start production. Consider scaling capacity.`,
        metric: `${backlog}`,
        icon: "inventory",
      });
    }

    // Invoice aging insight
    const overdue30 = parseInt(aging.overdue_30) || 0;
    const overdue60 = parseInt(aging.overdue_60) || 0;
    const overdue90 = parseInt(aging.overdue_90_plus) || 0;
    if (overdue60 + overdue90 > 0) {
      insights.push({
        type: "error",
        category: "Invoices",
        title: "Aging Invoices Alert",
        message: `${overdue60 + overdue90} invoices are overdue by 60+ days. Immediate follow-up recommended.`,
        metric: `${overdue60 + overdue90}`,
        icon: "schedule",
      });
    }

    // Production efficiency
    const avgDaily = parseFloat(prod.avg_daily_output);
    const peakOutput = parseInt(prod.peak_output);
    if (avgDaily > 0 && peakOutput > 0) {
      const efficiency = ((avgDaily / peakOutput) * 100).toFixed(0);
      insights.push({
        type: parseInt(efficiency) > 70 ? "success" : "info",
        category: "Production",
        title: "Capacity Utilization",
        message: `Running at ${efficiency}% of peak capacity. Average: ${Math.round(avgDaily)} units/day, Peak: ${peakOutput} units/day.`,
        metric: `${efficiency}%`,
        icon: "speed",
      });
    }

    // Predictions (simple linear projection)
    const monthlyData = monthlyPerformance.rows;
    const recentMonths = monthlyData.slice(-3);
    let projectedRevenue = null;
    if (recentMonths.length >= 2) {
      const revenues = recentMonths.map((m) => parseFloat(m.collected));
      const avgGrowth =
        revenues.length >= 2
          ? (revenues[revenues.length - 1] - revenues[0]) / (revenues.length - 1)
          : 0;
      projectedRevenue = Math.max(0, revenues[revenues.length - 1] + avgGrowth);
    }

    // ── Try Gemini AI for smarter insights ──
    const metricsForAI = {
      revenue: {
        current_month: currentMonth,
        last_month: lastMonth,
        growth_percent: parseFloat(revenueGrowth),
        total_all_time: parseFloat(rev.total_all_time),
        projected_next_month: projectedRevenue,
      },
      production: {
        total_produced_30d: totalProduced,
        total_defective_30d: totalDefective,
        quality_rate: parseFloat(qualityRate),
        avg_daily_output: parseFloat(prod.avg_daily_output),
        peak_output: parseInt(prod.peak_output),
        active_days: parseInt(prod.active_days),
      },
      orders: {
        total: totalOrders,
        delivered: deliveredCount,
        completion_rate: parseFloat(completionRate),
        backlog: parseInt(ord.backlog),
        in_production: parseInt(ord.in_production),
        cancelled: parseInt(ord.cancelled),
        avg_delivery_days: parseFloat(ord.avg_delivery_days) || 0,
      },
      customers: {
        total: parseInt(cust.total),
        active: parseInt(cust.active),
        total_outstanding: totalOutstanding,
        avg_outstanding: parseFloat(cust.avg_outstanding),
        max_outstanding: parseFloat(cust.max_outstanding),
      },
      payments: {
        collected_this_month: parseFloat(pay.collected),
        invoiced_this_month: parseFloat(pay.invoiced),
        collection_rate: parseFloat(collectionRate),
      },
      invoices: {
        current: parseInt(aging.current_count) || 0,
        overdue_30: overdue30,
        overdue_60: overdue60,
        overdue_90_plus: overdue90,
        total_unpaid: parseFloat(aging.total_unpaid),
      },
    };

    let aiInsights = await getGeminiInsights(metricsForAI);
    const finalInsights = aiInsights || insights;

    res.json({
      scores: {
        overall: overallScore,
        revenue: Math.round(revenueScore),
        quality: Math.round(qualityScore),
        completion: Math.round(completionScore),
        collection: Math.round(collectionScore),
      },
      metrics: {
        revenue_growth: parseFloat(revenueGrowth),
        current_month_revenue: currentMonth,
        last_month_revenue: lastMonth,
        total_revenue: parseFloat(rev.total_all_time),
        quality_rate: parseFloat(qualityRate),
        completion_rate: parseFloat(completionRate),
        collection_rate: parseFloat(collectionRate),
        total_outstanding: totalOutstanding,
        avg_delivery_days: parseFloat(ord.avg_delivery_days) || 0,
        active_customers: parseInt(cust.active),
        total_orders: totalOrders,
        projected_revenue: projectedRevenue,
      },
      insights: finalInsights,
      ai_powered: !!aiInsights,
      charts: {
        monthly_performance: monthlyData.map((m) => ({
          month: m.label,
          orders: parseInt(m.orders),
          invoiced: parseFloat(m.invoiced),
          collected: parseFloat(m.collected),
          produced: parseInt(m.produced),
        })),
        weekly_trend: weeklyTrend.rows.map((w) => ({
          week: w.week,
          orders: parseInt(w.orders),
          value: parseFloat(w.value),
        })),
        customer_revenue: customerRevenue.rows.map((c) => ({
          name: c.company_name || c.name,
          revenue: parseFloat(c.revenue),
          orders: parseInt(c.order_count),
        })),
        priority_distribution: ordersByPriority.rows.map((p) => ({
          name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
          count: parseInt(p.count),
          value: parseFloat(p.value),
        })),
        quality_by_shift: productionQuality.rows.map((s) => ({
          shift: s.shift.charAt(0).toUpperCase() + s.shift.slice(1),
          produced: parseInt(s.produced),
          defective: parseInt(s.defective),
          quality:
            parseInt(s.produced) > 0
              ? (
                  ((parseInt(s.produced) - parseInt(s.defective)) / parseInt(s.produced)) *
                  100
                ).toFixed(1)
              : 100,
        })),
        invoice_aging: {
          current: parseInt(aging.current_count) || 0,
          overdue_30: overdue30,
          overdue_60: overdue60,
          overdue_90_plus: overdue90,
          total_unpaid: parseFloat(aging.total_unpaid),
        },
        payment_modes: paymentModes.rows.map((m) => ({
          mode: m.payment_mode,
          count: parseInt(m.count),
          total: parseFloat(m.total),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
