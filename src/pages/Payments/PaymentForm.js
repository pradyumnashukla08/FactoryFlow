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
import { formatCurrency, PAYMENT_MODE_CONFIG } from "../../utils/formatters";
import toast from "react-hot-toast";

const PaymentForm = ({ open, onClose, onSuccess, preselectedCustomerId, preselectedInvoiceId }) => {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_mode: "cash",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        customer_id: preselectedCustomerId || "",
        invoice_id: preselectedInvoiceId || "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: "cash",
        reference_number: "",
        notes: "",
      });
      setError("");
    }
  }, [open, preselectedCustomerId, preselectedInvoiceId]);

  useEffect(() => {
    if (open) {
      const fetchCustomers = async () => {
        try {
          const result = await api.getCustomers({ limit: 200 });
          setCustomers(result.customers || []);
        } catch (err) {
          /* silent */
        }
      };
      fetchCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (formData.customer_id) {
      const fetchInvoices = async () => {
        try {
          const result = await api.getInvoices({ customer_id: formData.customer_id, limit: 100 });
          setInvoices(
            (result.invoices || []).filter((i) => i.status !== "paid" && i.status !== "cancelled"),
          );
        } catch (err) {
          /* silent */
        }
      };
      fetchInvoices();
    } else {
      setInvoices([]);
    }
  }, [formData.customer_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const selectedCustomer = customers.find((c) => String(c.id) === String(formData.customer_id));
  const selectedInvoice = invoices.find((i) => String(i.id) === String(formData.invoice_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      setError("Please select a customer");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      await api.recordPayment({
        customer_id: Number(formData.customer_id),
        invoice_id: formData.invoice_id ? Number(formData.invoice_id) : null,
        amount: Number(formData.amount),
        payment_date: formData.payment_date,
        payment_mode: formData.payment_mode,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
      });
      toast.success("Payment recorded!");
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={600}>
          Record Payment
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

          {/* Context Info */}
          {selectedCustomer && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Outstanding Balance:{" "}
              <strong>{formatCurrency(selectedCustomer.outstanding_balance)}</strong>
            </Alert>
          )}
          {selectedInvoice && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Invoice {selectedInvoice.invoice_number} — Total:{" "}
              <strong>{formatCurrency(selectedInvoice.grand_total)}</strong>
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Customer *"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                size="small"
                disabled={!!preselectedCustomerId}
              >
                <MenuItem value="">Select Customer</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ""} —{" "}
                    {formatCurrency(c.outstanding_balance)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Invoice (Optional)"
                name="invoice_id"
                value={formData.invoice_id}
                onChange={handleChange}
                size="small"
                disabled={!!preselectedInvoiceId || !formData.customer_id}
              >
                <MenuItem value="">No specific invoice</MenuItem>
                {invoices.map((inv) => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} — {formatCurrency(inv.grand_total)} ({inv.status})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (₹) *"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                size="small"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Mode"
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleChange}
                size="small"
              >
                {Object.entries(PAYMENT_MODE_CONFIG).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference Number"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                size="small"
                placeholder="Transaction ID, Cheque #, etc."
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 140 }}>
            {loading ? <CircularProgress size={20} /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default PaymentForm;
