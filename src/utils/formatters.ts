import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type {
  OrderStatus,
  InvoiceStatus,
  Priority,
  PaymentMode,
  StatusConfig,
  PaymentModeConfig,
} from "../types";

// ── Indian Currency Formatting ────────────────────────────────

/** Format as Indian currency: ₹1,23,456.00 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return "₹0.00";
  const num = Number(amount);
  if (isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/** Short currency format: ₹1.2L, ₹50K, ₹2.3Cr */
export const formatCurrencyShort = (amount: number | string | null | undefined): string => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

/** Indian number format: 1,23,456 */
export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(Number(num));
};

// ── Date Formatting ────────────────────────────────

type DateInput = string | Date | null | undefined;

/** Format as: 01 Jan 2026 */
export const formatDate = (date: DateInput): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy");
};

/** Format as: 01 Jan 2026, 02:30 PM */
export const formatDateTime = (date: DateInput): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy, hh:mm a");
};

/** Format as: 01/01/2026 */
export const formatDateShort = (date: DateInput): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy");
};

/** Format as: 2 days ago */
export const formatRelativeDate = (date: DateInput): string => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
};

/** Format as: 2026-01-01 (for HTML date inputs) */
export const formatDateForInput = (date: DateInput): string => {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
};

// ── Phone Formatting ────────────────────────────────

/** Format Indian phone numbers: 98765-43210 or +91 98765-43210 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// ── Number to Words (Indian System) ────────────────────────────────

const ones: string[] = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens: string[] = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const numToWords = (n: number): string => {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000)
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + numToWords(n % 100) : "");
  if (n < 100000)
    return (
      numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "")
    );
  if (n < 10000000)
    return (
      numToWords(Math.floor(n / 100000)) +
      " Lakh" +
      (n % 100000 ? " " + numToWords(n % 100000) : "")
    );
  return (
    numToWords(Math.floor(n / 10000000)) +
    " Crore" +
    (n % 10000000 ? " " + numToWords(n % 10000000) : "")
  );
};

/** Convert a numeric amount to Indian English words for invoices */
export const numberToWords = (amount: number | string | null | undefined): string => {
  if (!amount || isNaN(Number(amount))) return "Zero Rupees Only";
  const num = Math.abs(Number(amount));
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = numToWords(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + numToWords(paise) + " Paise";
  }
  result += " Only";
  return result;
};

// ── Status Configuration Maps ────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: { label: "Pending", color: "default", bgColor: "#f1f5f9", textColor: "#475569" },
  confirmed: { label: "Confirmed", color: "info", bgColor: "#dbeafe", textColor: "#1d4ed8" },
  in_production: {
    label: "In Production",
    color: "warning",
    bgColor: "#fef3c7",
    textColor: "#b45309",
  },
  quality_check: {
    label: "Quality Check",
    color: "secondary",
    bgColor: "#f3e8ff",
    textColor: "#7c3aed",
  },
  ready: { label: "Ready", color: "success", bgColor: "#dcfce7", textColor: "#15803d" },
  dispatched: { label: "Dispatched", color: "info", bgColor: "#cffafe", textColor: "#0e7490" },
  delivered: { label: "Delivered", color: "success", bgColor: "#d1fae5", textColor: "#047857" },
  cancelled: { label: "Cancelled", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  unpaid: { label: "Unpaid", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" },
  partial: { label: "Partial", color: "warning", bgColor: "#fef3c7", textColor: "#b45309" },
  paid: { label: "Paid", color: "success", bgColor: "#dcfce7", textColor: "#15803d" },
  overdue: { label: "Overdue", color: "error", bgColor: "#fecaca", textColor: "#991b1b" },
  cancelled: { label: "Cancelled", color: "default", bgColor: "#f1f5f9", textColor: "#475569" },
};

export const PRIORITY_CONFIG: Record<Priority, StatusConfig> = {
  low: { label: "Low", color: "default", bgColor: "#f1f5f9", textColor: "#475569" },
  normal: { label: "Normal", color: "info", bgColor: "#dbeafe", textColor: "#1d4ed8" },
  high: { label: "High", color: "warning", bgColor: "#fef3c7", textColor: "#b45309" },
  urgent: { label: "Urgent", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" },
};

export const PAYMENT_MODE_CONFIG: Record<PaymentMode, PaymentModeConfig> = {
  cash: { label: "Cash", icon: "💵" },
  upi: { label: "UPI", icon: "📱" },
  bank_transfer: { label: "Bank Transfer", icon: "🏦" },
  cheque: { label: "Cheque", icon: "📝" },
  neft: { label: "NEFT", icon: "🔄" },
  rtgs: { label: "RTGS", icon: "⚡" },
  other: { label: "Other", icon: "💰" },
};

// ── Validation ────────────────────────────────

/** Validate Indian GSTIN format (15-character alphanumeric) */
export const isValidGSTIN = (gstin: string | null | undefined): boolean => {
  if (!gstin) return true; // optional field
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.toUpperCase());
};

/** Truncate text with ellipsis */
export const truncate = (str: string | null | undefined, length: number = 30): string => {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
};
