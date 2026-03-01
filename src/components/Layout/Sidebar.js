import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  PrecisionManufacturing as ProductionIcon,
  Receipt as InvoicesIcon,
  Payment as PaymentsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Factory as FactoryIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Customers", icon: <PeopleIcon />, path: "/customers" },
  { text: "Orders", icon: <OrdersIcon />, path: "/orders" },
  { text: "Production", icon: <ProductionIcon />, path: "/production" },
  { text: "Invoices", icon: <InvoicesIcon />, path: "/invoices" },
  { text: "Payments", icon: <PaymentsIcon />, path: "/payments" },
  { text: "AI Insights", icon: <AIIcon />, path: "/insights" },
];

const bottomItems = [{ text: "Settings", icon: <SettingsIcon />, path: "/settings" }];

const Sidebar = ({ open, mobileOpen, onToggle, onMobileClose, drawerWidth, collapsedWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentWidth = open ? drawerWidth : collapsedWidth;

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) onMobileClose();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo / Brand */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minHeight: 70,
          borderBottom: "1px solid",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FactoryIcon sx={{ color: "#fff", fontSize: 24 }} />
        </Box>
        {open && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.1rem",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              FactoryFlow
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
            >
              Production Management
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton
            onClick={onToggle}
            sx={{
              ml: "auto",
              color: "rgba(255,255,255,0.5)",
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
              display: open ? "flex" : "none",
            }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* User Info */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#f97316",
            fontSize: "0.9rem",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </Avatar>
        {open && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography
              variant="body2"
              sx={{
                color: "#fff",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "User"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}
            >
              {user?.factory_name || "Factory"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Menu Items */}
      <List sx={{ flex: 1, py: 1, px: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={!open ? item.text : ""} placement="right" arrow>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: open ? "initial" : "center",
                  px: open ? 2 : 1.5,
                  bgcolor: isActive(item.path) ? "rgba(249, 115, 22, 0.15)" : "transparent",
                  color: isActive(item.path) ? "#f97316" : "rgba(255,255,255,0.7)",
                  "&:hover": {
                    bgcolor: isActive(item.path)
                      ? "rgba(249, 115, 22, 0.2)"
                      : "rgba(255,255,255,0.08)",
                    color: "#fff",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : "auto",
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: isActive(item.path) ? 600 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      {/* Bottom Items */}
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <List sx={{ py: 1, px: 1 }}>
        {bottomItems.map((item) => (
          <Tooltip key={item.text} title={!open ? item.text : ""} placement="right" arrow>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: open ? "initial" : "center",
                  px: open ? 2 : 1.5,
                  color: isActive(item.path) ? "#f97316" : "rgba(255,255,255,0.7)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : "auto",
                    justifyContent: "center",
                    color: "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: "0.9rem" }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
        <Tooltip title={!open ? "Logout" : ""} placement="right" arrow>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                minHeight: 44,
                justifyContent: open ? "initial" : "center",
                px: open ? 2 : 1.5,
                color: "rgba(255,255,255,0.7)",
                "&:hover": { bgcolor: "rgba(239,68,68,0.15)", color: "#ef4444" },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                  color: "inherit",
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              {open && (
                <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.9rem" }} />
              )}
            </ListItemButton>
          </ListItem>
        </Tooltip>
      </List>

      {/* Collapse Button (when collapsed) */}
      {!open && !isMobile && (
        <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{
              color: "rgba(255,255,255,0.5)",
              "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  const drawerStyles = {
    "& .MuiDrawer-paper": {
      width: isMobile ? drawerWidth : currentWidth,
      bgcolor: "#0b1f3b",
      borderRight: "none",
      boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
      transition: "width 0.3s ease",
      overflowX: "hidden",
    },
  };

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={drawerStyles}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer variant="permanent" open sx={drawerStyles}>
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
