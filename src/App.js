import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/Layout/AppLayout";
import { useAuth } from "./context/AuthContext";
import { Box, CircularProgress } from "@mui/material";
import "./App.css";

// Public pages
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));

// Protected pages
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const CustomerList = lazy(() => import("./pages/Customers/CustomerList"));
const CustomerDetail = lazy(() => import("./pages/Customers/CustomerDetail"));
const OrderList = lazy(() => import("./pages/Orders/OrderList"));
const OrderCreate = lazy(() => import("./pages/Orders/OrderCreate"));
const OrderDetail = lazy(() => import("./pages/Orders/OrderDetail"));
const ProductionOverview = lazy(() => import("./pages/Production/ProductionOverview"));
const InvoiceList = lazy(() => import("./pages/Invoices/InvoiceList"));
const InvoiceCreate = lazy(() => import("./pages/Invoices/InvoiceCreate"));
const InvoiceDetail = lazy(() => import("./pages/Invoices/InvoiceDetail"));
const PaymentList = lazy(() => import("./pages/Payments/PaymentList"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const AIInsights = lazy(() => import("./pages/Insights/AIInsights"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <CircularProgress sx={{ color: "#0b1f3b" }} />
  </Box>
);

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: "10px", background: "#1e293b", color: "#fff", fontSize: "0.9rem" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" }, duration: 4000 },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
          />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/new" element={<OrderCreate />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/production" element={<ProductionOverview />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/insights" element={<AIInsights />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
