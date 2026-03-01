import React from "react";
import { useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu as MenuIcon, NavigateNext as NavigateNextIcon } from "@mui/icons-material";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/customers": "Customers",
  "/orders": "Orders",
  "/orders/new": "New Order",
  "/production": "Production",
  "/invoices": "Invoices",
  "/invoices/new": "New Invoice",
  "/payments": "Payments",
  "/insights": "AI Insights",
  "/settings": "Settings",
};

const AppHeader = ({ onMenuClick, onToggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const getPageTitle = () => {
    const path = location.pathname;
    if (routeTitles[path]) return routeTitles[path];
    if (path.match(/\/customers\/\d+/)) return "Customer Details";
    if (path.match(/\/orders\/\d+/)) return "Order Details";
    if (path.match(/\/invoices\/\d+/)) return "Invoice Details";
    return "FactoryFlow";
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    const crumbs = [];
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const title =
        routeTitles[currentPath] ||
        (isNaN(part) ? part.charAt(0).toUpperCase() + part.slice(1) : `#${part}`);
      crumbs.push({ label: title, path: currentPath, isLast: index === parts.length - 1 });
    });
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid",
        borderColor: "divider",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 1, color: "text.primary" }}>
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              color: "text.primary",
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            {getPageTitle()}
          </Typography>
          {breadcrumbs.length > 1 && (
            <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ mt: 0.25 }}>
              {breadcrumbs.map((crumb) =>
                crumb.isLast ? (
                  <Typography key={crumb.path} variant="caption" color="text.secondary">
                    {crumb.label}
                  </Typography>
                ) : (
                  <Link
                    key={crumb.path}
                    href={crumb.path}
                    underline="hover"
                    variant="caption"
                    color="text.secondary"
                    sx={{ "&:hover": { color: "primary.main" } }}
                  >
                    {crumb.label}
                  </Link>
                ),
              )}
            </Breadcrumbs>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
