import type {
  User,
  Customer,
  Order,
  OrderStatus,
  Invoice,
  InvoiceStatus,
  Payment,
  ProductionLog,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ChangePasswordData,
  OrdersResponse,
  InvoicesResponse,
  PaymentsResponse,
  DashboardData,
  InsightsData,
  ImportResult,
  HealthCheck,
  DemoRequest,
} from "../types";

const API_BASE: string = process.env.REACT_APP_API_URL || "/api";

interface RequestOptions extends RequestInit {
  _retries?: number;
}

interface TokenPayload {
  exp?: number;
  id?: number;
  email?: string;
  role?: string;
}

class ApiService {
  private baseUrl: string;
  private _refreshPromise: Promise<void> | null;
  private _refreshTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.baseUrl = API_BASE;
    this._refreshPromise = null;
    this._scheduleTokenRefresh();
  }

  getToken(): string | null {
    return localStorage.getItem("factoryflow_token");
  }

  /**
   * Decode a JWT payload to check expiry (without verification).
   */
  private _decodeToken(token: string): TokenPayload | null {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  /**
   * Schedule a proactive token refresh 5 minutes before expiry.
   */
  private _scheduleTokenRefresh(): void {
    const token = this.getToken();
    if (!token) return;

    const decoded = this._decodeToken(token);
    if (!decoded || !decoded.exp) return;

    const msUntilExpiry = decoded.exp * 1000 - Date.now();
    const refreshIn = Math.max(msUntilExpiry - 5 * 60 * 1000, 0);

    clearTimeout(this._refreshTimer);
    this._refreshTimer = setTimeout(() => this._refreshToken(), refreshIn);
  }

  /**
   * Refresh the token. Deduplicates concurrent refresh calls.
   */
  private async _refreshToken(): Promise<void> {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      try {
        const data = await this.request<{ token: string }>("/auth/refresh-token", {
          method: "POST",
        });
        if (data.token) {
          localStorage.setItem("factoryflow_token", data.token);
          this._scheduleTokenRefresh();
        }
      } catch {
        // Token refresh failed — user will be logged out on next 401
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const maxRetries = options._retries ?? 2;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          throw new Error("You appear to be offline. Please check your internet connection.");
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status >= 400 && response.status < 500) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.error || data.errors?.[0]?.msg || `Request failed (${response.status})`,
          );
        }

        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }

        const data: T = await response.json();
        return data;
      } catch (err) {
        lastError = err as Error;

        if (
          lastError.message.includes("(4") ||
          lastError.message.includes("offline") ||
          attempt === maxRetries
        ) {
          throw lastError;
        }

        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }

    throw lastError;
  }

  // ── Auth ────────────────────────────────

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Demo Requests ────────────────────────────────

  async submitDemoRequest(formData: Partial<DemoRequest>): Promise<DemoRequest> {
    return this.request<DemoRequest>("/demo-requests", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  }

  // ── Customers ────────────────────────────────

  async getCustomers(params: Record<string, string> = {}): Promise<{ customers: Customer[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ customers: Customer[] }>(`/customers?${query}`);
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  async getCustomerOrders(id: number): Promise<Order[]> {
    return this.request<Order[]>(`/customers/${id}/orders`);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/customers/${id}`, { method: "DELETE" });
  }

  // ── Orders ────────────────────────────────

  async getOrders(params: Record<string, string> = {}): Promise<OrdersResponse> {
    const query = new URLSearchParams(params).toString();
    return this.request<OrdersResponse>(`/orders?${query}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(data: Partial<Order>): Promise<Order> {
    return this.request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    return this.request<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteOrder(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/orders/${id}`, { method: "DELETE" });
  }

  // ── Production ────────────────────────────────

  async addProductionLog(data: Partial<ProductionLog>): Promise<ProductionLog> {
    return this.request<ProductionLog>("/production", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProductionByOrder(orderId: number): Promise<ProductionLog[]> {
    return this.request<ProductionLog[]>(`/production/order/${orderId}`);
  }

  async getDailyProduction(date?: string): Promise<ProductionLog[]> {
    return this.request<ProductionLog[]>(`/production/daily?date=${date || ""}`);
  }

  // ── Invoices ────────────────────────────────

  async getInvoices(params: Record<string, string> = {}): Promise<InvoicesResponse> {
    const query = new URLSearchParams(params).toString();
    return this.request<InvoicesResponse>(`/invoices?${query}`);
  }

  async getInvoice(id: number): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    return this.request<Invoice>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteInvoice(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/invoices/${id}`, { method: "DELETE" });
  }

  // ── Payments ────────────────────────────────

  async getPayments(params: Record<string, string> = {}): Promise<PaymentsResponse> {
    const query = new URLSearchParams(params).toString();
    return this.request<PaymentsResponse>(`/payments?${query}`);
  }

  async recordPayment(data: Partial<Payment>): Promise<Payment> {
    return this.request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ── Dashboard ────────────────────────────────

  async getDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>("/dashboard");
  }

  // ── AI Insights ────────────────────────────────

  async getInsights(): Promise<InsightsData> {
    return this.request<InsightsData>("/insights");
  }

  // ── Import / Export ────────────────────────────────

  async downloadTemplate(): Promise<void> {
    const url = `${this.baseUrl}/import/template`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });
    if (!res.ok) throw new Error("Failed to download template");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "FactoryFlow_Customer_Import_Template.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async importCustomers(file: File): Promise<ImportResult> {
    const url = `${this.baseUrl}/import/customers`;
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token || ""}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Import failed");
    return data as ImportResult;
  }

  async exportCustomers(format: string = "excel"): Promise<void> {
    const url = `${this.baseUrl}/export/customers?format=${format}`;
    const token = this.getToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });
    if (!res.ok) throw new Error("Failed to export");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = format === "excel" ? "customers.xlsx" : "customers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Health ────────────────────────────────

  async healthCheck(): Promise<HealthCheck> {
    return this.request<HealthCheck>("/health");
  }
}

const api = new ApiService();
export default api;
