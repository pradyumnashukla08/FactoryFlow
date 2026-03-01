import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const emptyItem = { name: "", quantity: 1, rate: 0, amount: 0 };

const OrderCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    customer_id: searchParams.get("customer") || "",
    delivery_date: "",
    priority: "normal",
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

  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxRate = 18;
  const taxAmount = (totalAmount * taxRate) / 100;
  const grandTotal = totalAmount + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      setError("Please select a customer");
      return;
    }
    if (items.some((item) => !item.name.trim())) {
      setError("All items must have a name");
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
        delivery_date: formData.delivery_date || null,
        priority: formData.priority,
        notes: formData.notes,
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          amount: Number(item.amount),
        })),
        total_quantity: totalQuantity,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        grand_total: grandTotal,
      };
      const result = await api.createOrder(payload);
      toast.success(`Order ${result.order_number} created!`);
      navigate("/orders");
    } catch (err) {
      setError(err.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/orders")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Orders
      </Button>

      <Box component="form" onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Order Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Order Information
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
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Delivery Date"
                  name="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={handleFormChange}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleFormChange}
                  size="small"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </TextField>
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
                  placeholder="Special instructions, material specs, etc."
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
                    <TableCell sx={{ width: "40%" }}>Product / Description</TableCell>
                    <TableCell sx={{ width: "15%" }} align="right">
                      Qty
                    </TableCell>
                    <TableCell sx={{ width: "15%" }} align="right">
                      Rate (₹)
                    </TableCell>
                    <TableCell sx={{ width: "15%" }} align="right">
                      Amount (₹)
                    </TableCell>
                    <TableCell sx={{ width: "10%" }} align="center"></TableCell>
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
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, "name", e.target.value)}
                          variant="standard"
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
                          sx={{ width: 80 }}
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

            {/* Totals */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Box sx={{ width: 300 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(totalAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    GST (18%)
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(taxAmount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" fontWeight={700}>
                    Grand Total
                  </Typography>
                  <Typography variant="body1" fontWeight={700} color="primary">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block", textAlign: "right" }}
                >
                  Total Qty: {totalQuantity}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Submit */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => navigate("/orders")} size="large">
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
            Create Order
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderCreate;
