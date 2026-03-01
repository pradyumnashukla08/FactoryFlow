import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const currentWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        open={sidebarOpen}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={() => setMobileOpen(false)}
        drawerWidth={DRAWER_WIDTH}
        collapsedWidth={DRAWER_COLLAPSED}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          ml: { xs: 0, md: `${currentWidth}px` },
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        <AppHeader
          onMenuClick={toggleMobile}
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
