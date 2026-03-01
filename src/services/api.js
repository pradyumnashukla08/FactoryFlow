const API_BASE = process.env.REACT_APP_API_URL || "/api";

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem("factoryflow_token");
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.[0]?.msg || "Request failed");
    }

    return data;
  }

  // ---- Auth ----
  async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request("/auth/me");
  }

  async updateProfile(data) {
    return this.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data) {
    return this.request("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ---- Demo Requests ----
  async submitDemoRequest(formData) {
    return this.request("/demo-requests", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }

  // ---- Customers ----
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers?${query}`);
  }

  async getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  async getCustomerOrders(id) {
    return this.request(`/customers/${id}/orders`);
  }

  async createCustomer(data) {
    return this.request("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id) {
    return this.request(`/customers/${id}`, { method: "DELETE" });
  }

  // ---- Orders ----
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/orders?${query}`);
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id, data) {
    return this.request(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteOrder(id) {
    return this.request(`/orders/${id}`, { method: "DELETE" });
  }

  // ---- Production ----
  async addProductionLog(data) {
    return this.request("/production", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProductionByOrder(orderId) {
    return this.request(`/production/order/${orderId}`);
  }

  async getDailyProduction(date) {
    return this.request(`/production/daily?date=${date || ""}`);
  }

  // ---- Invoices ----
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/invoices?${query}`);
  }

  async getInvoice(id) {
    return this.request(`/invoices/${id}`);
  }

  async createInvoice(data) {
    return this.request("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateInvoiceStatus(id, status) {
    return this.request(`/invoices/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteInvoice(id) {
    return this.request(`/invoices/${id}`, { method: "DELETE" });
  }

  // ---- Payments ----
  async getPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/payments?${query}`);
  }

  async recordPayment(data) {
    return this.request("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ---- Dashboard ----
  async getDashboard() {
    return this.request("/dashboard");
  }

  // ---- AI Insights ----
  async getInsights() {
    return this.request("/insights");
  }

  // ---- Import / Export ----
  async downloadTemplate() {
    const url = `${this.baseUrl}/import/template`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to download template");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "FactoryFlow_Customer_Import_Template.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async importCustomers(file) {
    const url = `${this.baseUrl}/import/customers`;
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import failed");
    return data;
  }

  async exportCustomers(format = "excel") {
    const url = `${this.baseUrl}/export/customers?format=${format}`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to export");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = format === "excel" ? "customers.xlsx" : "customers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---- Health ----
  async healthCheck() {
    return this.request("/health");
  }
}

const api = new ApiService();
export default api;
