import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Button,
  Paper,
} from "@mui/material";
import {
  ShoppingCart as OrdersIcon,
  Receipt as InvoicesIcon,
  PrecisionManufacturing as ProductionIcon,
  CurrencyRupee as RupeeIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon,
  ArrowForward as ArrowForwardIcon,
  People as PeopleIcon,
  Add as AddIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatNumber,
  ORDER_STATUS_CONFIG,
  PAYMENT_MODE_CONFIG,
} from "../../utils/formatters";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "#94a3b8",
  confirmed: "#3b82f6",
  in_production: "#f59e0b",
  quality_check: "#8b5cf6",
  ready: "#22c55e",
  dispatched: "#06b6d4",
  delivered: "#059669",
  cancelled: "#ef4444",
};

const CUSTOMER_PIE_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#eab308",
];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  const revenue = data?.revenue || {};
  const orders = data?.orders || {};
  const invoices = data?.invoices || {};
  const production = data?.production_today || {};
  const outstanding = data?.outstanding || 0;
  const recentPayments = data?.recent_payments || [];
  const topCustomers = data?.top_customers || [];
  const monthlyTrend = (revenue?.monthly_trend || []).map((m) => ({
    ...m,
    revenue: Number(m.revenue) || 0,
  }));

  const statusDistribution = (orders?.status_distribution || []).map((s) => ({
    name: ORDER_STATUS_CONFIG[s.status]?.label || s.status,
    value: Number(s.count),
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  const defectRate =
    production.produced > 0 ? ((production.defective / production.produced) * 100).toFixed(1) : 0;

  const hasData =
    monthlyTrend.length > 0 ||
    recentPayments.length > 0 ||
    topCustomers.length > 0 ||
    statusDistribution.length > 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* ── Welcome Header ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
            {greeting()}, {user?.name?.split(" ")[0] || "Boss"} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with <strong>{user?.factory_name || "your factory"}</strong>{" "}
            today.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboard}
            sx={{ borderColor: "#e2e8f0", color: "text.secondary" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate("/orders/new")}
            sx={{ bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" } }}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Today's Revenue"
            value={formatCurrency(revenue.today)}
            subtitle={`This Month: ${formatCurrencyShort(revenue.this_month)}`}
            icon={<RupeeIcon />}
            color="#22c55e"
            bgColor="#dcfce7"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Pending Orders"
            value={formatNumber(orders.pending_count)}
            subtitle="Active orders in pipeline"
            icon={<OrdersIcon />}
            color="#f97316"
            bgColor="#ffedd5"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Unpaid Invoices"
            value={formatCurrency(invoices.unpaid_total)}
            subtitle={`${formatNumber(invoices.unpaid_count)} invoices pending`}
            icon={<InvoicesIcon />}
            color="#ef4444"
            bgColor="#fee2e2"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KPICard
            title="Today's Production"
            value={`${formatNumber(production.produced)} units`}
            subtitle={`Defect Rate: ${defectRate}%`}
            icon={<ProductionIcon />}
            color="#3b82f6"
            bgColor="#dbeafe"
          />
        </Grid>
      </Grid>

      {/* ── AI Insights Banner ── */}
      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(135deg, #0b1f3b 0%, #1a365d 60%, #1e3a5f 100%)",
          color: "#fff",
          cursor: "pointer",
          transition: "all 0.3s ease",
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 30px rgba(11,31,59,0.3)" },
          position: "relative",
          overflow: "hidden",
        }}
        onClick={() => navigate("/insights")}
      >
        <Box
          sx={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.1)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 50,
            bottom: -20,
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.1)",
          }}
        />
        <CardContent sx={{ py: 2.5, position: "relative" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                }}
              >
                <AIIcon sx={{ color: "#fff", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  AI-Powered Insights
                  <Chip
                    label="NEW"
                    size="small"
                    sx={{
                      bgcolor: "#f97316",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.6rem",
                      height: 18,
                    }}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Factory health score, smart predictions & recommendations →
                </Typography>
              </Box>
            </Box>
            <ArrowForwardIcon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 28 }} />
          </Box>
        </CardContent>
      </Card>

      {/* ── Charts: Revenue Trend + Order Status ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Revenue Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 6 months performance
                  </Typography>
                </Box>
                <Chip
                  icon={<BarChartIcon sx={{ fontSize: 16 }} />}
                  label="Monthly"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#e2e8f0" }}
                />
              </Box>
              <Box sx={{ height: { xs: 260, sm: 320 } }}>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrencyShort(v)}
                        width={65}
                      />
                      <RechartsTooltip
                        formatter={(value) => [formatCurrency(value), "Revenue"]}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="url(#colorRevenue)"
                        dot={{ fill: "#f97316", r: 4, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, stroke: "#f97316", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={<BarChartIcon sx={{ fontSize: 52, color: "#cbd5e1" }} />}
                    title="No revenue data yet"
                    subtitle="Revenue chart will appear once you start recording payments"
                    action={
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate("/payments")}
                        sx={{ mt: 1.5 }}
                      >
                        Record Payment
                      </Button>
                    }
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Order Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current distribution
                  </Typography>
                </Box>
                <Chip
                  icon={<PieChartIcon sx={{ fontSize: 16 }} />}
                  label="Live"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#e2e8f0" }}
                />
              </Box>
              {statusDistribution.length > 0 ? (
                <>
                  <Box sx={{ height: 210, display: "flex", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [value, name]}
                          contentStyle={{ borderRadius: 8, fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {statusDistribution.map((entry, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: entry.color,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {entry.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {entry.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <EmptyState
                  icon={<PieChartIcon sx={{ fontSize: 52, color: "#cbd5e1" }} />}
                  title="No orders yet"
                  subtitle="Create your first order to see status breakdown"
                  action={
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate("/orders/new")}
                      sx={{ mt: 1.5 }}
                    >
                      Create Order
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Outstanding + Production + Top Customers ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #0b1f3b 0%, #1a365d 100%)",
              color: "#fff",
              height: "100%",
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <WalletIcon sx={{ color: "rgba(255,255,255,0.6)", fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  Total Outstanding
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, mb: 1, fontSize: { xs: "1.8rem", sm: "2.2rem" } }}
              >
                {formatCurrency(outstanding)}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                Pending from all active customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <ProductionIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Production Today
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Good Units
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    {formatNumber(
                      Math.max(0, (production.produced || 0) - (production.defective || 0)),
                    )}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={
                    production.produced > 0
                      ? ((production.produced - production.defective) / production.produced) * 100
                      : 0
                  }
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "#f1f5f9",
                    "& .MuiLinearProgress-bar": { bgcolor: "#22c55e", borderRadius: 5 },
                  }}
                />
              </Box>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Defective Units
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="error.main">
                    {formatNumber(production.defective || 0)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Number(defectRate)}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "#f1f5f9",
                    "& .MuiLinearProgress-bar": { bgcolor: "#ef4444", borderRadius: 5 },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ py: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <PeopleIcon sx={{ color: "#f97316", fontSize: 20 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Top Customers by Revenue
                </Typography>
              </Box>
              {topCustomers.length > 0 ? (
                <Box sx={{ height: 170 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCustomers.slice(0, 5)}
                      layout="vertical"
                      margin={{ left: 0, right: 10 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        formatter={(v) => [formatCurrency(v), "Total Paid"]}
                        contentStyle={{ borderRadius: 8, fontSize: 13 }}
                      />
                      <Bar dataKey="total_paid" fill="#f97316" radius={[0, 6, 6, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <EmptyState
                  icon={<PeopleIcon sx={{ fontSize: 40, color: "#cbd5e1" }} />}
                  title="No customer data"
                  subtitle="Add customers to track revenue"
                  small
                  action={
                    <Button size="small" variant="text" onClick={() => navigate("/customers")}>
                      Add Customer
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Company Performance Bar + Revenue Pie ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Company Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue comparison by month
                  </Typography>
                </Box>
                <Chip
                  icon={<BarChartIcon sx={{ fontSize: 16 }} />}
                  label="Bar Chart"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#e2e8f0" }}
                />
              </Box>
              <Box sx={{ height: { xs: 260, sm: 300 } }}>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => formatCurrencyShort(v)}
                        width={65}
                      />
                      <RechartsTooltip
                        formatter={(value) => [formatCurrency(value), "Revenue"]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Bar
                        dataKey="revenue"
                        name="Monthly Revenue"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={<BarChartIcon sx={{ fontSize: 52, color: "#cbd5e1" }} />}
                    title="Performance chart coming soon"
                    subtitle="Data will populate as you record payments over months"
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Revenue Share
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By customer
                  </Typography>
                </Box>
                <Chip
                  icon={<PieChartIcon sx={{ fontSize: 16 }} />}
                  label="Pie"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "#e2e8f0" }}
                />
              </Box>
              {topCustomers.length > 0 ? (
                <>
                  <Box sx={{ height: 210, display: "flex", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCustomers
                            .slice(0, 6)
                            .map((c) => ({
                              name: c.company_name || c.name,
                              value: Number(c.total_paid) || 0,
                            }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={82}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                        >
                          {topCustomers.slice(0, 6).map((_, i) => (
                            <Cell
                              key={i}
                              fill={CUSTOMER_PIE_COLORS[i % CUSTOMER_PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v, name) => [formatCurrency(v), name]}
                          contentStyle={{ borderRadius: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    {topCustomers.slice(0, 5).map((c, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.4,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: CUSTOMER_PIE_COLORS[i],
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 120 }}
                          >
                            {c.company_name || c.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrencyShort(c.total_paid)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <EmptyState
                  icon={<PieChartIcon sx={{ fontSize: 52, color: "#cbd5e1" }} />}
                  title="No revenue data"
                  subtitle="Pie chart will show once payments are recorded"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Getting Started (only when empty) ── */}
      {!hasData && (
        <Card sx={{ mb: 3, border: "2px dashed #e2e8f0", boxShadow: "none", bgcolor: "#fafbfc" }}>
          <CardContent sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              🚀 Get Started with FactoryFlow
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 500, mx: "auto" }}
            >
              Set up your factory in 3 simple steps to start managing everything from one dashboard.
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {[
                {
                  step: "1",
                  title: "Add Customers",
                  desc: "Add your factory's clients",
                  path: "/customers",
                  color: "#3b82f6",
                  icon: <PeopleIcon />,
                },
                {
                  step: "2",
                  title: "Create Orders",
                  desc: "Log your first order",
                  path: "/orders/new",
                  color: "#f97316",
                  icon: <OrdersIcon />,
                },
                {
                  step: "3",
                  title: "Generate Invoice",
                  desc: "Send GST invoices",
                  path: "/invoices/new",
                  color: "#22c55e",
                  icon: <InvoicesIcon />,
                },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.step}>
                  <Paper
                    onClick={() => navigate(item.path)}
                    sx={{
                      p: 3,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      border: "1px solid #f1f5f9",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                        borderColor: item.color,
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        mx: "auto",
                        mb: 1.5,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Chip
                      label={`Step ${item.step}`}
                      size="small"
                      sx={{
                        bgcolor: `${item.color}15`,
                        color: item.color,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        mb: 1,
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Payments ── */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recent Payments
            </Typography>
            {recentPayments.length > 0 && (
              <Button
                size="small"
                onClick={() => navigate("/payments")}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{ color: "#f97316" }}
              >
                View All
              </Button>
            )}
          </Box>
          {recentPayments.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "#f97316",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            {payment.customer_name?.charAt(0) || "?"}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {payment.customer_name || "Unknown"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(payment.payment_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {formatCurrency(payment.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            PAYMENT_MODE_CONFIG[payment.payment_mode]?.label || payment.payment_mode
                          }
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {payment.reference_number || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState
              icon={<WalletIcon sx={{ fontSize: 48, color: "#cbd5e1" }} />}
              title="No payments recorded yet"
              subtitle="Payments will show here once you start collecting"
              action={
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate("/payments")}
                  sx={{ mt: 1.5 }}
                >
                  Record Payment
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

/* ---- SUB-COMPONENTS ---- */

const KPICard = ({ title, value, subtitle, icon, color, bgColor }) => (
  <Card
    sx={{
      position: "relative",
      overflow: "hidden",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 25px rgba(0,0,0,0.08)" },
    }}
  >
    <CardContent sx={{ py: 2.5, px: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 0.5, fontWeight: 500, fontSize: "0.8rem" }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "text.primary",
              mb: 0.5,
              fontSize: { xs: "1.4rem", sm: "1.7rem" },
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {subtitle}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 2.5,
            bgcolor: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: color }} />
  </Card>
);

const EmptyState = ({ icon, title, subtitle, action, small }) => (
  <Box
    sx={{
      height: small ? 140 : "100%",
      minHeight: small ? 140 : 200,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      py: 3,
    }}
  >
    <Box sx={{ mb: 1.5, opacity: 0.6 }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5 }}>
      {title}
    </Typography>
    <Typography variant="caption" color="text.disabled" sx={{ maxWidth: 250, display: "block" }}>
      {subtitle}
    </Typography>
    {action}
  </Box>
);

const DashboardSkeleton = () => (
  <Box sx={{ maxWidth: 1400, mx: "auto" }}>
    <Box sx={{ mb: 3 }}>
      <Skeleton width={280} height={36} sx={{ mb: 0.5 }} />
      <Skeleton width={350} height={20} />
    </Box>
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <Grid item xs={12} sm={6} lg={3} key={i}>
          <Card>
            <CardContent sx={{ py: 2.5 }}>
              <Skeleton width="50%" height={16} sx={{ mb: 1 }} />
              <Skeleton width="70%" height={32} sx={{ mb: 0.5 }} />
              <Skeleton width="60%" height={14} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ py: 2.5 }}>
        <Skeleton width="100%" height={56} />
      </CardContent>
    </Card>
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Skeleton width="40%" height={24} sx={{ mb: 1 }} />
            <Skeleton height={300} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Skeleton width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton height={300} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default Dashboard;
