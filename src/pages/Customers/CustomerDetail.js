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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from "@mui/material";
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import CustomerForm from "./CustomerForm";
import {
  formatCurrency,
  formatDate,
  formatPhone,
  ORDER_STATUS_CONFIG,
} from "../../utils/formatters";
import toast from "react-hot-toast";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const [customerData, ordersData] = await Promise.all([
        api.getCustomer(id),
        api.getCustomerOrders(id),
      ]);
      setCustomer(customerData);
      setOrders(ordersData || []);
    } catch (err) {
      toast.error("Failed to load customer");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={200} sx={{ mb: 2 }} />
        <Card>
          <CardContent>
            <Skeleton height={200} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!customer) return null;

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/customers")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Customers
      </Button>

      {/* Customer Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "#0b1f3b",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                }}
              >
                {customer.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {customer.name}
                </Typography>
                {customer.company_name && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <BusinessIcon sx={{ fontSize: 16 }} /> {customer.company_name}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
                size="small"
              >
                Edit
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/orders/new?customer=${id}`)}
                size="small"
                color="secondary"
              >
                New Order
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Outstanding Balance
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: Number(customer.outstanding_balance) > 0 ? "#ef4444" : "#22c55e" }}
              >
                {formatCurrency(customer.outstanding_balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Phone
              </Typography>
              <Typography
                variant="body1"
                fontWeight={500}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />{" "}
                {formatPhone(customer.phone)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography
                variant="body1"
                fontWeight={500}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} /> {customer.email || "—"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Location
              </Typography>
              <Typography
                variant="body1"
                fontWeight={500}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                {[customer.city, customer.state].filter(Boolean).join(", ") || "—"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detail Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                GSTIN
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                {customer.gstin || "—"}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Pincode
              </Typography>
              <Typography variant="body1">{customer.pincode || "—"}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1">{customer.address || "—"}</Typography>
            </Grid>
            {customer.notes && (
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1">{customer.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Tab */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Orders ({orders.length})
          </Typography>
          {orders.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Delivery</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontFamily: "monospace" }}
                        >
                          {order.order_number}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{formatDate(order.delivery_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                          size="small"
                          sx={{
                            bgcolor: ORDER_STATUS_CONFIG[order.status]?.bgColor,
                            color: ORDER_STATUS_CONFIG[order.status]?.textColor,
                            fontWeight: 600,
                            fontSize: "0.75rem",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(order.grand_total)}
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
                No orders yet
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <CustomerForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          fetchCustomer();
        }}
        customer={customer}
      />
    </Box>
  );
};

export default CustomerDetail;
