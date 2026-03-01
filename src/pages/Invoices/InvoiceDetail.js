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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import PaymentForm from "../Payments/PaymentForm";
import {
  formatCurrency,
  formatDate,
  INVOICE_STATUS_CONFIG,
  numberToWords,
} from "../../utils/formatters";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import toast from "react-hot-toast";

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getInvoice(id);
      setInvoice(result);
      setNewStatus(result.status);
    } catch (err) {
      toast.error("Failed to load invoice");
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleStatusUpdate = async () => {
    try {
      await api.updateInvoiceStatus(id, newStatus);
      toast.success("Invoice status updated");
      setStatusDialog(false);
      fetchInvoice();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteInvoice(id);
      toast.success("Invoice deleted");
      navigate("/invoices");
    } catch (err) {
      toast.error("Failed to delete invoice");
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    try {
      generateInvoicePDF(invoice);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={200} sx={{ mb: 2 }} />
        <Card>
          <CardContent>
            <Skeleton height={400} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!invoice) return null;

  const items = invoice.items || [];
  const payments = invoice.payments || [];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/invoices")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back to Invoices
      </Button>

      {/* Invoice Header */}
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
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Typography variant="h5" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                  {invoice.invoice_number}
                </Typography>
                <Chip
                  label={INVOICE_STATUS_CONFIG[invoice.status]?.label || invoice.status}
                  sx={{
                    bgcolor: INVOICE_STATUS_CONFIG[invoice.status]?.bgColor,
                    color: INVOICE_STATUS_CONFIG[invoice.status]?.textColor,
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Customer: <strong>{invoice.customer_name}</strong>
                {invoice.company_name && ` (${invoice.company_name})`}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={handleDownloadPDF}
                size="small"
                color="error"
              >
                Download PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<PaymentIcon />}
                onClick={() => setPaymentFormOpen(true)}
                size="small"
                disabled={invoice.status === "paid" || invoice.status === "cancelled"}
              >
                Record Payment
              </Button>
              <Button variant="outlined" onClick={() => setStatusDialog(true)} size="small">
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
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Invoice Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(invoice.invoice_date)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(invoice.due_date)}
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
                {formatCurrency(invoice.grand_total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Customer GSTIN
              </Typography>
              <Typography variant="body1" fontWeight={500} sx={{ fontFamily: "monospace" }}>
                {invoice.customer_gstin || "—"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice View (GST Format) */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3, pb: 2, borderBottom: "2px solid #0b1f3b" }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#0b1f3b" }}>
              TAX INVOICE
            </Typography>
          </Box>

          {/* Customer Info */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Bill To:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {invoice.customer_name}
              </Typography>
              {invoice.company_name && (
                <Typography variant="body2">{invoice.company_name}</Typography>
              )}
              {invoice.customer_address && (
                <Typography variant="body2">{invoice.customer_address}</Typography>
              )}
              {(invoice.customer_city || invoice.customer_state) && (
                <Typography variant="body2">
                  {[invoice.customer_city, invoice.customer_state].filter(Boolean).join(", ")}
                </Typography>
              )}
              {invoice.customer_gstin && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  GSTIN: <strong>{invoice.customer_gstin}</strong>
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { sm: "right" } }}>
              <Typography variant="body2">
                <strong>Invoice #:</strong> {invoice.invoice_number}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {formatDate(invoice.invoice_date)}
              </Typography>
              <Typography variant="body2">
                <strong>Due:</strong> {formatDate(invoice.due_date)}
              </Typography>
            </Grid>
          </Grid>

          {/* Items Table */}
          <TableContainer sx={{ mb: 3 }}>
            <Table size="small" sx={{ border: "1px solid #e2e8f0" }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>HSN/SAC</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Qty
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Rate
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.description || item.name}</TableCell>
                    <TableCell>{item.hsn || "—"}</TableCell>
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

          {/* Tax Breakdown */}
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Box sx={{ width: 320 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatCurrency(invoice.subtotal)}
                </Typography>
              </Box>
              {Number(invoice.cgst_amount) > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    CGST @{invoice.cgst_rate}%
                  </Typography>
                  <Typography variant="body2">{formatCurrency(invoice.cgst_amount)}</Typography>
                </Box>
              )}
              {Number(invoice.sgst_amount) > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    SGST @{invoice.sgst_rate}%
                  </Typography>
                  <Typography variant="body2">{formatCurrency(invoice.sgst_amount)}</Typography>
                </Box>
              )}
              {Number(invoice.igst_amount) > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    IGST @{invoice.igst_rate}%
                  </Typography>
                  <Typography variant="body2">{formatCurrency(invoice.igst_amount)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" fontWeight={700}>
                  Grand Total
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(invoice.grand_total)}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block", fontStyle: "italic" }}
              >
                {numberToWords(invoice.grand_total)}
              </Typography>
            </Box>
          </Box>

          {invoice.notes && (
            <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Notes:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.notes}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary">
              This is a computer-generated invoice and does not require a signature.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Payments ({payments.length})
          </Typography>
          {payments.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.payment_date)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {formatCurrency(p.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.payment_mode}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>{p.reference_number || "—"}</TableCell>
                      <TableCell>{p.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No payments recorded
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      <PaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSuccess={() => {
          setPaymentFormOpen(false);
          fetchInvoice();
        }}
        preselectedCustomerId={invoice.customer_id}
        preselectedInvoiceId={invoice.id}
      />

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Invoice Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            sx={{ mt: 1 }}
          >
            {Object.entries(INVOICE_STATUS_CONFIG).map(([key, val]) => (
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

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs">
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>?
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

export default InvoiceDetail;
