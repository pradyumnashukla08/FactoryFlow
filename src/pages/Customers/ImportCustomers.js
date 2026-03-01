import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";
import api from "../../services/api";
import toast from "react-hot-toast";

const ImportCustomers = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setResults(null);
    setDragActive(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      await api.downloadTemplate();
      toast.success("Template downloaded!");
    } catch (err) {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    const validExt = /\.(xlsx|xls|csv)$/i;

    if (!validTypes.includes(selectedFile.type) && !validExt.test(selectedFile.name)) {
      toast.error("Please upload an Excel (.xlsx) or CSV file");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    setFile(selectedFile);
    setResults(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setResults(null);
      const data = await api.importCustomers(file);
      setResults(data.results);
      if (data.results.imported > 0) {
        toast.success(`${data.results.imported} customers imported!`);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.message || "Import failed");
      setResults({ total: 0, imported: 0, skipped: 0, errors: [{ row: 0, reason: err.message }] });
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ bgcolor: "#dcfce7", color: "#22c55e", width: 40, height: 40 }}>
            <UploadIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Import Customers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload Excel file to bulk-add customers
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={uploading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Step 1: Download Template */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Chip
              label="1"
              size="small"
              sx={{ bgcolor: "#f97316", color: "#fff", fontWeight: 700, width: 24, height: 24 }}
            />
            Download Template
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            fullWidth
            sx={{
              py: 1.5,
              borderColor: "#e2e8f0",
              borderStyle: "dashed",
              color: "text.secondary",
              "&:hover": { borderColor: "#f97316", color: "#f97316", bgcolor: "#fff7ed" },
            }}
          >
            Download Excel Template (with sample data & instructions)
          </Button>
        </Box>

        {/* Step 2: Upload File */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: "text.secondary",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Chip
              label="2"
              size="small"
              sx={{ bgcolor: "#f97316", color: "#fff", fontWeight: 700, width: 24, height: 24 }}
            />
            Upload Your File
          </Typography>

          {!file ? (
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragActive ? "#f97316" : "#e2e8f0"}`,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: dragActive ? "#fff7ed" : "#fafbfc",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#f97316", bgcolor: "#fff7ed" },
              }}
            >
              <ExcelIcon sx={{ fontSize: 48, color: dragActive ? "#f97316" : "#cbd5e1", mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {dragActive ? "Drop file here" : "Drag & drop your Excel file here"}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                or click to browse — Supports .xlsx, .xls, .csv (max 5MB)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar sx={{ bgcolor: "#dcfce7", color: "#22c55e" }}>
                <FileIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(file.size)}
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setFile(null);
                  setResults(null);
                }}
                size="small"
                disabled={uploading}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              sx={{
                borderRadius: 4,
                height: 6,
                bgcolor: "#f1f5f9",
                "& .MuiLinearProgress-bar": { bgcolor: "#f97316" },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block", textAlign: "center" }}
            >
              Processing... this may take a moment for large files
            </Typography>
          </Box>
        )}

        {/* Results */}
        {results && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: "text.secondary",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Chip
                label="3"
                size="small"
                sx={{ bgcolor: "#f97316", color: "#fff", fontWeight: 700, width: 24, height: 24 }}
              />
              Import Results
            </Typography>

            {/* Summary */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <Box
                sx={{ flex: 1, p: 1.5, bgcolor: "#dcfce7", borderRadius: 2, textAlign: "center" }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#16a34a" }}>
                  {results.imported}
                </Typography>
                <Typography variant="caption" sx={{ color: "#16a34a" }}>
                  Imported
                </Typography>
              </Box>
              <Box
                sx={{ flex: 1, p: 1.5, bgcolor: "#fef3c7", borderRadius: 2, textAlign: "center" }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#d97706" }}>
                  {results.skipped}
                </Typography>
                <Typography variant="caption" sx={{ color: "#d97706" }}>
                  Skipped
                </Typography>
              </Box>
              <Box
                sx={{ flex: 1, p: 1.5, bgcolor: "#f1f5f9", borderRadius: 2, textAlign: "center" }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#64748b" }}>
                  {results.total}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Total Rows
                </Typography>
              </Box>
            </Box>

            {results.imported > 0 && (
              <Alert severity="success" sx={{ mb: 1, borderRadius: 2 }}>
                {results.imported} customers imported successfully!
              </Alert>
            )}

            {results.errors.length > 0 && (
              <Box
                sx={{
                  maxHeight: 150,
                  overflow: "auto",
                  border: "1px solid #fee2e2",
                  borderRadius: 2,
                  bgcolor: "#fef2f2",
                }}
              >
                <List dense disablePadding>
                  {results.errors.slice(0, 10).map((err, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <WarningIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Row ${err.row}: ${err.reason}`}
                        primaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                      />
                    </ListItem>
                  ))}
                  {results.errors.length > 10 && (
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={`... and ${results.errors.length - 10} more warnings`}
                        primaryTypographyProps={{
                          variant: "caption",
                          color: "text.disabled",
                          fontStyle: "italic",
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={uploading} sx={{ color: "text.secondary" }}>
          {results?.imported > 0 ? "Done" : "Cancel"}
        </Button>
        {!results?.imported && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={<UploadIcon />}
            sx={{ bgcolor: "#f97316", "&:hover": { bgcolor: "#ea580c" } }}
          >
            {uploading ? "Importing..." : "Import Customers"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportCustomers;
