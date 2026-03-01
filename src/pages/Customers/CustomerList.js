import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import CustomerForm from "./CustomerForm";
import ImportCustomers from "./ImportCustomers";
import { formatCurrency, formatPhone } from "../../utils/formatters";
import toast from "react-hot-toast";

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: page + 1, limit: rowsPerPage };
      if (search) params.search = search;
      const result = await api.getCustomers(params);
      setCustomers(result.customers || []);
      setTotal(result.total || 0);
    } catch (err) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setSearch(value);
        setPage(0);
      }, 400),
    );
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.deleteCustomer(deleteDialog.id);
      toast.success("Customer deleted");
      setDeleteDialog(null);
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditCustomer(null);
    fetchCustomers();
  };

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
          Manage your customer database
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportOpen(true)}
            sx={{
              borderColor: "#e2e8f0",
              color: "text.secondary",
              "&:hover": { borderColor: "#f97316", color: "#f97316" },
            }}
          >
            Import Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={async () => {
              try {
                await api.exportCustomers("excel");
                toast.success("Customer list exported!");
              } catch (err) {
                toast.error("Export failed");
              }
            }}
            sx={{
              borderColor: "#e2e8f0",
              color: "text.secondary",
              "&:hover": { borderColor: "#22c55e", color: "#22c55e" },
            }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditCustomer(null);
              setFormOpen(true);
            }}
            sx={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" }}
          >
            Add Customer
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <TextField
            fullWidth
            placeholder="Search by name, company, or phone..."
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>GSTIN</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {search
                        ? "No customers found matching your search"
                        : "No customers yet — add your first customer!"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: "#0b1f3b",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        >
                          {customer.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {customer.name}
                          </Typography>
                          {customer.company_name && (
                            <Typography variant="caption" color="text.secondary">
                              {customer.company_name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatPhone(customer.phone)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                      >
                        {customer.gstin || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {customer.city || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          color: Number(customer.outstanding_balance) > 0 ? "#ef4444" : "#22c55e",
                        }}
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        sx={{ color: "#3b82f6" }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditCustomer(customer);
                          setFormOpen(true);
                        }}
                        sx={{ color: "#f97316" }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog(customer)}
                        sx={{ color: "#ef4444" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        )}
      </Card>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditCustomer(null);
        }}
        onSuccess={handleFormSuccess}
        customer={editCustomer}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs">
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Customers Dialog */}
      <ImportCustomers
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchCustomers}
      />
    </Box>
  );
};

export default CustomerList;
