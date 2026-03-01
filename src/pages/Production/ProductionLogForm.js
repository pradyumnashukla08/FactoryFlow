import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../services/api";
import toast from "react-hot-toast";

const ProductionLogForm = ({ open, onClose, onSuccess, orderId }) => {
  const [formData, setFormData] = useState({
    order_id: orderId || "",
    log_date: new Date().toISOString().split("T")[0],
    units_produced: "",
    units_defective: 0,
    worker_name: "",
    shift: "day",
    notes: "",
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) {
      setFormData((prev) => ({ ...prev, order_id: orderId }));
    }
  }, [orderId]);

  useEffect(() => {
    if (open && !orderId) {
      const fetchOrders = async () => {
        try {
          const result = await api.getOrders({ status: "in_production", limit: 100 });
          setOrders(result.orders || []);
        } catch (err) {
          // silently fail
        }
      };
      fetchOrders();
    }
  }, [open, orderId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.order_id) {
      setError("Please select an order");
      return;
    }
    if (!formData.units_produced || Number(formData.units_produced) < 0) {
      setError("Please enter valid units produced");
      return;
    }

    setLoading(true);
    try {
      await api.addProductionLog({
        order_id: Number(formData.order_id),
        log_date: formData.log_date,
        units_produced: Number(formData.units_produced),
        units_defective: Number(formData.units_defective) || 0,
        worker_name: formData.worker_name,
        shift: formData.shift,
        notes: formData.notes,
      });
      toast.success("Production logged!");
      onSuccess();
      // Reset form
      setFormData({
        order_id: orderId || "",
        log_date: new Date().toISOString().split("T")[0],
        units_produced: "",
        units_defective: 0,
        worker_name: "",
        shift: "day",
        notes: "",
      });
    } catch (err) {
      setError(err.message || "Failed to log production");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={600}>
          Log Production
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            {!orderId && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Order *"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleChange}
                  size="small"
                >
                  <MenuItem value="">Select Order</MenuItem>
                  {orders.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.order_number} — {o.customer_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                name="log_date"
                type="date"
                value={formData.log_date}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Shift"
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                size="small"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="night">Night</MenuItem>
                <MenuItem value="general">General</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Units Produced *"
                name="units_produced"
                type="number"
                value={formData.units_produced}
                onChange={handleChange}
                size="small"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Units Defective"
                name="units_defective"
                type="number"
                value={formData.units_defective}
                onChange={handleChange}
                size="small"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Worker Name"
                name="worker_name"
                value={formData.worker_name}
                onChange={handleChange}
                size="small"
                placeholder="Name of the worker"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                size="small"
                multiline
                rows={2}
                placeholder="Any production notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={20} /> : "Log Production"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ProductionLogForm;
