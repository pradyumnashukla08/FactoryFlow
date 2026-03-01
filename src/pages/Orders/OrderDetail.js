import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import ProductionLogForm from "../Production/ProductionLogForm";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "../../utils/formatters";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "in_production",
  "quality_check",
  "ready",
  "dispatched",
  "delivered",
];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [productionFormOpen, setProductionFormOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getOrder(id);
      setOrder(result);
      setNewStatus(result.status);
    } catch (err) {
      toast.error("Failed to load order");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    try {
      await api.updateOrderStatus(id, newStatus);
      toast.success("Status updated!");
      setStatusDialog(false);
      fetchOrder();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteOrder(id);
      toast.success("Order deleted");
      navigate("/orders");
    } catch (err) {
      toast.error("Failed to delete order");
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={200} sx={{ mb: 2 }} />
        <Card>
          <CardContent>
            <Skeleton height={300} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const items = order.items || [];
  const productionLogs = order.production_logs || [];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/orders")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Orders
      </Button>

      {/* Order Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                  {order.order_number}
                </Typography>
                <Chip
                  label={ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                  sx={{
                    bgcolor: ORDER_STATUS_CONFIG[order.status]?.bgColor,
                    color: ORDER_STATUS_CONFIG[order.status]?.textColor,
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={PRIORITY_CONFIG[order.priority]?.label || order.priority}
                  size="small"
                  sx={{
                    bgcolor: PRIORITY_CONFIG[order.priority]?.bgColor,
                    color: PRIORITY_CONFIG[order.priority]?.textColor,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Customer: <strong>{order.customer_name}</strong>
                {order.company_name && ` (${order.company_name})`}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setStatusDialog(true)}
                size="small"
                disabled={order.status === "delivered" || order.status === "cancelled"}
              >
                Update Status
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialog(true)}
                size="small"
              >
                Delete
              </Button>
            </Box>
          </Box>

          {/* Status Pipeline */}
          {order.status !== "cancelled" && (
            <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
              {STATUS_STEPS.map((step) => (
                <Step key={step} completed={STATUS_STEPS.indexOf(step) <= currentStep}>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                      {ORDER_STATUS_CONFIG[step]?.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </CardContent>
      </Card>

      {/* Order Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(order.order_date)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Delivery Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(order.delivery_date)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Quantity
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {order.total_quantity} units
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Grand Total
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary">
                {formatCurrency(order.grand_total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Order Items
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Box sx={{ width: 250 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2">{formatCurrency(order.total_amount)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Tax
                </Typography>
                <Typography variant="body2">{formatCurrency(order.tax_amount)}</Typography>
              </Box>
              {Number(order.discount_amount) > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Discount
                  </Typography>
                  <Typography variant="body2" color="error">
                    -{formatCurrency(order.discount_amount)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body1" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="body1" fontWeight={700}>
                  {formatCurrency(order.grand_total)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Notes */}
      {order.notes && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.notes}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Production Logs */}
      <Card>
        <CardContent>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
            <Typography variant="h6" fontWeight={600}>
              Production Logs ({productionLogs.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={() => setProductionFormOpen(true)}
            >
              Log Production
            </Button>
          </Box>
          {productionLogs.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Worker</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell align="right">Produced</TableCell>
                    <TableCell align="right">Defective</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.log_date)}</TableCell>
                      <TableCell>{log.worker_name || "—"}</TableCell>
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
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No production logs yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, val]) => (
              <MenuItem key={key} value={key}>
                {val.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Production Log Form */}
      <ProductionLogForm
        open={productionFormOpen}
        onClose={() => setProductionFormOpen(false)}
        onSuccess={() => {
          setProductionFormOpen(false);
          fetchOrder();
        }}
        orderId={Number(id)}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs">
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete order <strong>{order.order_number}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail;
