import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        background: "linear-gradient(135deg, #0b1f3b 0%, #1a365d 100%)",
        color: "#fff",
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: "6rem", md: "10rem" },
          fontWeight: 900,
          background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1,
          mb: 2,
        }}
      >
        404
      </Typography>

      <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: "#cbd5e1" }}>
        Page Not Found
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: "#94a3b8", maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            "&:hover": {
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
            },
          }}
        >
          {isAuthenticated ? "Go to Dashboard" : "Go Home"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            borderColor: "#475569",
            color: "#cbd5e1",
            "&:hover": {
              borderColor: "#94a3b8",
              backgroundColor: "rgba(255,255,255,0.05)",
            },
          }}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
}
