import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Avatar,
  Divider,
  Paper,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon,
  Psychology as BrainIcon,
  Lightbulb as LightbulbIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import api from "../../services/api";
import { formatCurrency, formatCurrencyShort } from "../../utils/formatters";
import toast from "react-hot-toast";

const INSIGHT_ICONS = {
  trending_up: <TrendingUpIcon />,
  trending_down: <TrendingDownIcon />,
  trending_flat: <TrendingFlatIcon />,
  verified: <VerifiedIcon />,
  warning: <WarningIcon />,
  speed: <SpeedIcon />,
  schedule: <ScheduleIcon />,
  account_balance: <AccountBalanceIcon />,
  inventory: <InventoryIcon />,
  lightbulb: <LightbulbIcon />,
  star: <StarIcon />,
  analytics: <AnalyticsIcon />,
};

const INSIGHT_COLORS = {
  success: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
  warning: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  error: { bg: "#fee2e2", color: "#dc2626", border: "#fecaca" },
  info: { bg: "#dbeafe", color: "#2563eb", border: "#bfdbfe" },
};

const PIE_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

const AIInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getInsights();
      setData(result);
    } catch (err) {
      toast.error("Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading && !data) {
    return <InsightsSkeleton />;
  }

  const scores = data?.scores || {};
  const metrics = data?.metrics || {};
  const insights = data?.insights || [];
  const charts = data?.charts || {};
  const aiPowered = data?.ai_powered || false;

  const scoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f97316";
    if (score >= 40) return "#eab308";
    return "#ef4444";
  };

  const scoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Average";
    return "Needs Work";
  };

  const radarData = [
    { subject: "Revenue", value: scores.revenue || 0, fullMark: 100 },
    { subject: "Quality", value: scores.quality || 0, fullMark: 100 },
    { subject: "Delivery", value: scores.completion || 0, fullMark: 100 },
    { subject: "Collection", value: scores.collection || 0, fullMark: 100 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              width: 44,
              height: 44,
            }}
          >
            <AIIcon sx={{ color: "#fff" }} />
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              AI-powered analysis of your factory operations
            </Typography>
          </Box>
          {aiPowered && (
            <Chip
              icon={<AIIcon sx={{ fontSize: 16 }} />}
              label="Powered by Gemini AI"
              size="small"
              sx={{
                ml: 1,
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.7rem",
                "& .MuiChip-icon": { color: "#fff" },
              }}
            />
          )}
        </Box>
        <Tooltip title="Refresh Analysis">
          <IconButton onClick={fetchInsights} size="small" sx={{ bgcolor: "#f1f5f9" }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overall Score Card */}
      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(135deg, #0b1f3b 0%, #1a365d 50%, #1e3a5f 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: -20,
            top: -20,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.1)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 40,
            bottom: -30,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.1)",
          }}
        />
        <CardContent sx={{ py: 3, position: "relative" }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <BrainIcon sx={{ color: "#a78bfa" }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "rgba(255,255,255,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Factory Health Score
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 1,
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "3.5rem", sm: "4.5rem" },
                      color: scoreColor(scores.overall),
                    }}
                  >
                    {scores.overall || 0}
                  </Typography>
                  <Typography variant="h5" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    /100
                  </Typography>
                </Box>
                <Chip
                  label={scoreLabel(scores.overall)}
                  size="small"
                  sx={{
                    bgcolor: `${scoreColor(scores.overall)}20`,
                    color: scoreColor(scores.overall),
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    mt: 0.5,
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { label: "Revenue Growth", value: scores.revenue, color: "#22c55e" },
                  { label: "Production Quality", value: scores.quality, color: "#3b82f6" },
                  { label: "Order Completion", value: scores.completion, color: "#f97316" },
                  { label: "Payment Collection", value: scores.collection, color: "#8b5cf6" },
                ].map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: item.color, fontWeight: 600 }}>
                        {item.value || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={item.value || 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: "rgba(255,255,255,0.1)",
                        "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI Insights Cards */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <LightbulbIcon sx={{ color: "#f97316", fontSize: 20 }} />
          <Typography variant="h6" fontWeight={600}>
            Smart Insights
          </Typography>
          <Chip
            label="AI"
            size="small"
            sx={{ bgcolor: "#8b5cf620", color: "#8b5cf6", fontWeight: 700, fontSize: "0.7rem" }}
          />
        </Box>
        <Grid container spacing={2}>
          {insights.map((insight, index) => {
            const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.info;
            return (
              <Grid item xs={12} sm={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    border: `1px solid ${colors.border}`,
                    bgcolor: colors.bg,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1.5,
                      }}
                    >
                      <Chip
                        label={insight.category}
                        size="small"
                        sx={{
                          bgcolor: `${colors.color}15`,
                          color: colors.color,
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: `${colors.color}20`,
                          color: colors.color,
                        }}
                      >
                        {INSIGHT_ICONS[insight.icon] || <LightbulbIcon />}
                      </Avatar>
                    </Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: colors.color, mb: 0.5 }}
                    >
                      {insight.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", mb: 1.5, lineHeight: 1.6 }}
                    >
                      {insight.message}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: colors.color }}>
                        {insight.metric}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(metrics.total_revenue),
            sub: `Growth: ${metrics.revenue_growth > 0 ? "+" : ""}${metrics.revenue_growth}%`,
            color: "#22c55e",
          },
          {
            label: "Active Customers",
            value: metrics.active_customers,
            sub: `Outstanding: ${formatCurrencyShort(metrics.total_outstanding)}`,
            color: "#3b82f6",
          },
          {
            label: "Avg Delivery",
            value: `${metrics.avg_delivery_days?.toFixed(1) || 0} days`,
            sub: `${metrics.total_orders} total orders`,
            color: "#f97316",
          },
          {
            label: "Projected Revenue",
            value: metrics.projected_revenue
              ? formatCurrencyShort(metrics.projected_revenue)
              : "N/A",
            sub: "Next month estimate",
            color: "#8b5cf6",
          },
        ].map((item, i) => (
          <Grid item xs={6} lg={3} key={i}>
            <Paper sx={{ p: 2.5, borderTop: `3px solid ${item.color}` }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {item.label}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, my: 0.5, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
              >
                {item.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Monthly Performance Bar Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Company Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly invoiced vs collected (12 months)
                  </Typography>
                </Box>
                <Chip label="Bar Chart" size="small" variant="outlined" />
              </Box>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly_performance || []} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        formatCurrency(value),
                        name === "invoiced" ? "Invoiced" : "Collected",
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="invoiced" name="Invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar
                      dataKey="collected"
                      name="Collected"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Customer Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Revenue Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  By customer
                </Typography>
              </Box>
              {(charts.customer_revenue || []).length > 0 ? (
                <>
                  <Box sx={{ height: 220, display: "flex", justifyContent: "center" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.customer_revenue}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="revenue"
                          nameKey="name"
                        >
                          {(charts.customer_revenue || []).map((entry, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v, name) => [formatCurrency(v), name]}
                          contentStyle={{ borderRadius: 8, fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 1.5 }}>
                    {(charts.customer_revenue || []).slice(0, 5).map((item, i) => (
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
                              bgcolor: PIE_COLORS[i],
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ maxWidth: 120 }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrencyShort(item.revenue)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No revenue data yet
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Row Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Production Trend Area Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Production Output
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Monthly units produced
              </Typography>
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthly_performance || []}>
                    <defs>
                      <linearGradient id="colorProduced" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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
                    />
                    <RechartsTooltip contentStyle={{ borderRadius: 8 }} />
                    <Area
                      type="monotone"
                      dataKey="produced"
                      name="Units"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorProduced)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality by Shift */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Quality by Shift
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Last 30 days
              </Typography>
              {(charts.quality_by_shift || []).length > 0 ? (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.quality_by_shift} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="shift"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                      <Bar
                        dataKey="produced"
                        name="Good"
                        fill="#22c55e"
                        radius={[0, 4, 4, 0]}
                        stackId="stack"
                      />
                      <Bar
                        dataKey="defective"
                        name="Defective"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                        stackId="stack"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No production data
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Invoice Aging */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Invoice Aging
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Overdue breakdown
              </Typography>
              {charts.invoice_aging ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {[
                    { label: "Current", value: charts.invoice_aging.current, color: "#22c55e" },
                    { label: "30 days", value: charts.invoice_aging.overdue_30, color: "#f59e0b" },
                    { label: "60 days", value: charts.invoice_aging.overdue_60, color: "#f97316" },
                    {
                      label: "90+ days",
                      value: charts.invoice_aging.overdue_90_plus,
                      color: "#ef4444",
                    },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(
                          100,
                          (item.value /
                            Math.max(
                              1,
                              charts.invoice_aging.current +
                                charts.invoice_aging.overdue_30 +
                                charts.invoice_aging.overdue_60 +
                                charts.invoice_aging.overdue_90_plus,
                            )) *
                            100,
                        )}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 4 },
                        }}
                      />
                    </Box>
                  ))}
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Unpaid
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      {formatCurrencyShort(charts.invoice_aging.total_unpaid)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No invoice data
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Modes + Priority Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Payment Methods
              </Typography>
              {(charts.payment_modes || []).length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.payment_modes}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="total"
                        nameKey="mode"
                        label={({ mode, percent }) => `${mode} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(charts.payment_modes || []).map((entry, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(v, name) => [formatCurrency(v), name]}
                        contentStyle={{ borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No payment data
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Orders by Priority
              </Typography>
              {(charts.priority_distribution || []).length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.priority_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        formatter={(v, name) => [
                          name === "count" ? v + " orders" : formatCurrency(v),
                          name === "count" ? "Count" : "Value",
                        ]}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      <Bar dataKey="count" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 250,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No order data
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Skeleton
const InsightsSkeleton = () => (
  <Box>
    <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
      <Skeleton variant="circular" width={44} height={44} />
      <Box>
        <Skeleton width={200} height={24} />
        <Skeleton width={300} height={16} />
      </Box>
    </Box>
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton height={200} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton height={200} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[1, 2, 3].map((i) => (
        <Grid item xs={12} md={4} key={i}>
          <Card>
            <CardContent>
              <Skeleton height={120} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <Card>
          <CardContent>
            <Skeleton height={320} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Card>
          <CardContent>
            <Skeleton height={320} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

export default AIInsights;
