// ============================================
// FactoryFlow — TypeScript Type Definitions
// ============================================

// ── Enums / Union Types ────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "quality_check"
  | "ready"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue" | "cancelled";

export type Priority = "low" | "normal" | "high" | "urgent";

export type PaymentMode = "cash" | "upi" | "bank_transfer" | "cheque" | "neft" | "rtgs" | "other";

export type UserRole = "owner" | "admin" | "staff";

export type Shift = "day" | "night" | "general";

export type ReminderType = "payment_due" | "order_status" | "delivery_reminder" | "custom";
export type ReminderChannel = "email" | "whatsapp" | "sms";
export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";
export type DemoRequestStatus = "new" | "contacted" | "demo_scheduled" | "converted" | "closed";

// ── Model Interfaces ────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  factory_name?: string;
  city?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  user_id: number;
  name: string;
  company_name?: string;
  email?: string;
  phone: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  outstanding_balance: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  rate: number;
  amount?: number;
  description?: string;
}

export interface Order {
  id: number;
  user_id: number;
  customer_id: number | null;
  order_number: string;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  priority: Priority;
  items: OrderItem[];
  total_quantity: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  notes?: string;
  // Joined fields
  customer_name?: string;
  company_name?: string;
  customer_phone?: string;
  production_logs?: ProductionLog[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  description?: string;
}

export interface Invoice {
  id: number;
  user_id: number;
  order_id?: number | null;
  customer_id: number | null;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  grand_total: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  // Joined fields
  customer_name?: string;
  company_name?: string;
  customer_gstin?: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_phone?: string;
  customer_email?: string;
  payments?: Payment[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  invoice_id?: number | null;
  customer_id: number | null;
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  reference_number?: string;
  notes?: string;
  // Joined fields
  customer_name?: string;
  invoice_number?: string;
  created_at: string;
}

export interface ProductionLog {
  id: number;
  order_id: number;
  user_id: number;
  log_date: string;
  units_produced: number;
  units_defective: number;
  worker_name?: string;
  shift: Shift;
  notes?: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  customer_id: number;
  invoice_id?: number | null;
  type: ReminderType;
  message?: string;
  channel: ReminderChannel;
  scheduled_at?: string;
  sent_at?: string;
  status: ReminderStatus;
  created_at: string;
}

export interface DemoRequest {
  id: number;
  name: string;
  factory_name?: string;
  phone: string;
  email: string;
  city?: string;
  billing_range?: string;
  message?: string;
  status: DemoRequestStatus;
  created_at: string;
}

// ── API Request / Response Types ────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  factory_name?: string;
  city?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardData {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  total_outstanding: number;
  pending_orders: number;
  overdue_invoices: number;
  recent_orders: Order[];
  recent_payments: Payment[];
  monthly_revenue: { month: string; revenue: number }[];
  order_status_breakdown: { status: string; count: number }[];
  [key: string]: unknown; // allow additional dashboard fields
}

export interface InsightsData {
  insights: string;
  generated_at: string;
  [key: string]: unknown;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors?: string[];
  message: string;
}

export interface HealthCheck {
  status: "ok" | "degraded";
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  database: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

// ── UI Config Types ────────────────────────────────

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface PaymentModeConfig {
  label: string;
  icon: string;
}

// ── Auth Context Types ────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<User>;
  checkAuth: () => Promise<void>;
}
