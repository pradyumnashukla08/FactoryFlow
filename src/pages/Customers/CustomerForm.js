import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../services/api";
import { isValidGSTIN } from "../../utils/formatters";
import toast from "react-hot-toast";

const initialForm = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  gstin: "",
  address: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  notes: "",
};

const CustomerForm = ({ open, onClose, onSuccess, customer }) => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!customer;

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        company_name: customer.company_name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        gstin: customer.gstin || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "Maharashtra",
        pincode: customer.pincode || "",
        notes: customer.notes || "",
      });
    } else {
      setFormData(initialForm);
    }
    setError("");
  }, [customer, open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (formData.gstin && !isValidGSTIN(formData.gstin)) {
      setError("Invalid GSTIN format. Expected: 22AAAAA0000A1Z5");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api.updateCustomer(customer.id, formData);
        toast.success("Customer updated");
      } else {
        await api.createCustomer(formData);
        toast.success("Customer created");
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" fontWeight={600}>
          {isEdit ? "Edit Customer" : "Add New Customer"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                size="small"
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone *"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GSTIN"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                size="small"
                placeholder="e.g., 22AAAAA0000A1Z5"
                helperText="15-character GST Identification Number"
                inputProps={{ style: { textTransform: "uppercase", fontFamily: "monospace" } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                size="small"
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
                placeholder="Any additional notes about this customer..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
            {loading ? <CircularProgress size={20} /> : isEdit ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CustomerForm;
