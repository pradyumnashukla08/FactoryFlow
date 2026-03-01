import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

const emptyItem = { description: "", hsn: "", quantity: 1, rate: 0, amount: 0 };

const InvoiceCreate = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInterState, setIsInterState] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    order_id: "",
    due_date: "",
    notes: "",
  });
  const [items, setItems] = useState([{ ...emptyItem }]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const result = await api.getCustomers({ limit: 100 });
        setCustomers(result.customers || []);
      } catch (err) {
        toast.error("Failed to load customers");
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      const fetchOrders = async () => {
        try {
          const result = await api.getOrders({ customer_id: formData.customer_id, limit: 100 });
          setOrders(result.orders || []);
        } catch (err) {
          // silently fail
        }
      };
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [formData.customer_id]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount =
        (Number(updated[index].quantity) || 0) * (Number(updated[index].rate) || 0);
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cgstRate = isInterState ? 0 : 9;
  const sgstRate = isInterState ? 0 : 9;
  const igstRate = isInterState ? 18 : 0;
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const igstAmount = (subtotal * igstRate) / 100;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = subtotal + totalTax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      setError("Please select a customer");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      setError("All items must have a description");
      return;
    }
    if (items.some((item) => item.quantity <= 0 || item.rate <= 0)) {
      setError("All items must have valid quantity and rate");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: Number(formData.customer_id),
        order_id: formData.order_id ? Number(formData.order_id) : null,
        due_date: formData.due_date || null,
        items: items.map((item) => ({
          description: item.description,
          hsn: item.hsn,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
        })),
        subtotal,
        cgst_rate: cgstRate,
        sgst_rate: sgstRate,
        igst_rate: igstRate,
        notes: formData.notes,
      };
      const result = await api.createInvoice(payload);
      toast.success(`Invoice ${result.invoice_number} created!`);
      navigate("/invoices");
    } catch (err) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/invoices")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Invoices
      </Button>

      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Invoice Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Invoice Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Customer *"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleFormChange}
                  size="small"
                >
                  <MenuItem value="">Select Customer</MenuItem>
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Linked Order (Optional)"
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleFormChange}
                  size="small"
                  disabled={!formData.customer_id}
                >
                  <MenuItem value="">No linked order</MenuItem>
                  {orders.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                      {o.order_number}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleFormChange}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {isInterState
                          ? "Inter-State (IGST 18%)"
                          : "Intra-State (CGST 9% + SGST 9%)"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Toggle for inter-state supply
                      </Typography>
                    </Box>
                  }
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Payment terms, bank details, etc."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Items */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
            >
              <Typography variant="h6" fontWeight={600}>
                Items
              </Typography>
              <Button startIcon={<AddIcon />} onClick={addItem} size="small" variant="outlined">
                Add Item
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "5%" }}>#</TableCell>
                    <TableCell sx={{ width: "35%" }}>Description</TableCell>
                    <TableCell sx={{ width: "12%" }}>HSN/SAC</TableCell>
                    <TableCell sx={{ width: "12%" }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ width: "14%" }} align="right">
                      Rate (₹)
                    </TableCell>
                    <TableCell sx={{ width: "14%" }} align="right">
                      Amount (₹)
                    </TableCell>
                    <TableCell sx={{ width: "8%" }} align="center"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="HSN"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                          variant="standard"
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          variant="standard"
                          inputProps={{ min: 1, style: { textAlign: "right" } }}
                          sx={{ width: 70 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          variant="standard"
                          inputProps={{ min: 0, step: 0.01, style: { textAlign: "right" } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(item.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          sx={{ color: "#ef4444" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Tax Breakdown */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: 320 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(subtotal)}
                  </Typography>
                </Box>
                {!isInterState ? (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        CGST @{cgstRate}%
                      </Typography>
                      <Typography variant="body2">{formatCurrency(cgstAmount)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        SGST @{sgstRate}%
                      </Typography>
                      <Typography variant="body2">{formatCurrency(sgstAmount)}</Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      IGST @{igstRate}%
                    </Typography>
                    <Typography variant="body2">{formatCurrency(igstAmount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tax
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(totalTax)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" fontWeight={700}>
                    Grand Total
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Submit */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => navigate("/invoices")} size="large">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            sx={{ minWidth: 160, background: "linear-gradient(135deg, #0b1f3b 0%, #1f3a5f 100%)" }}
          >
            Create Invoice
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceCreate;
