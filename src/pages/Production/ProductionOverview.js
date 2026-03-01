import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  PrecisionManufacturing as ProductionIcon,
  Warning as DefectIcon,
  Assignment as LogIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import ProductionLogForm from "./ProductionLogForm";
import { formatDate, formatNumber } from "../../utils/formatters";
import toast from "react-hot-toast";

const ProductionOverview = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const fetchProduction = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getDailyProduction(date);
      setData(result);
    } catch (err) {
      toast.error("Failed to load production data");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchProduction();
  }, [fetchProduction]);

  const summary = data?.summary || {};
  const logs = data?.logs || [];
  const defectRate =
    summary.total_produced > 0
      ? ((summary.total_defective / summary.total_produced) * 100).toFixed(1)
      : 0;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Daily production tracking and reporting
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" }}
          >
            Log Production
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Produced
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {loading ? <Skeleton width={60} /> : formatNumber(summary.total_produced || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    units today
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ProductionIcon sx={{ color: "#22c55e" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Defective
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {loading ? <Skeleton width={60} /> : formatNumber(summary.total_defective || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    units today
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DefectIcon sx={{ color: "#ef4444" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Defect Rate
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color: Number(defectRate) > 5 ? "#ef4444" : "#22c55e" }}
                  >
                    {loading ? <Skeleton width={60} /> : `${defectRate}%`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    quality metric
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ProductionIcon sx={{ color: "#f59e0b" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Orders Worked
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {loading ? <Skeleton width={60} /> : formatNumber(summary.orders_worked || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    active orders
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LogIcon sx={{ color: "#3b82f6" }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quality Progress */}
      {!loading && summary.total_produced > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Quality Score: {(100 - Number(defectRate)).toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={100 - Number(defectRate)}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: "#fee2e2",
                "& .MuiLinearProgress-bar": {
                  bgcolor: Number(defectRate) > 5 ? "#f59e0b" : "#22c55e",
                  borderRadius: 6,
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Production Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Production Logs — {formatDate(date)}
          </Typography>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={50} sx={{ mb: 1 }} />)
          ) : logs.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Worker</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell align="right">Produced</TableCell>
                    <TableCell align="right">Defective</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontFamily: "monospace" }}
                        >
                          {log.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.customer_name || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.worker_name || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.shift}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {log.units_produced}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={log.units_defective > 0 ? "error.main" : "text.secondary"}
                        >
                          {log.units_defective}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {log.notes || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <ProductionIcon sx={{ fontSize: 48, color: "#e2e8f0", mb: 1 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                No production logged for this date
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
                Log Production
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Production Log Form */}
      <ProductionLogForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          fetchProduction();
        }}
      />
    </Box>
  );
};

export default ProductionOverview;
