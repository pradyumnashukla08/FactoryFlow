import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// Indian currency formatting (₹1,23,456.00)
export const formatCurrency = (amount) => {
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

// Short currency (₹1.2L, ₹50K)
export const formatCurrencyShort = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

// Indian number format (1,23,456)
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-IN").format(Number(num));
};

// Date formatting
export const formatDate = (date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy");
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd MMM yyyy, hh:mm a");
};

export const formatDateShort = (date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy");
};

export const formatRelativeDate = (date) => {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatDateForInput = (date) => {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd");
};

// Phone formatting
export const formatPhone = (phone) => {
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

// Number to words converter (Indian system)
const ones = [
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
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const numToWords = (n) => {
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

export const numberToWords = (amount) => {
  if (!amount || isNaN(amount)) return "Zero Rupees Only";
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

// Status helpers
export const ORDER_STATUS_CONFIG = {
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

export const INVOICE_STATUS_CONFIG = {
  unpaid: { label: "Unpaid", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" },
  partial: { label: "Partial", color: "warning", bgColor: "#fef3c7", textColor: "#b45309" },
  paid: { label: "Paid", color: "success", bgColor: "#dcfce7", textColor: "#15803d" },
  overdue: { label: "Overdue", color: "error", bgColor: "#fecaca", textColor: "#991b1b" },
  cancelled: { label: "Cancelled", color: "default", bgColor: "#f1f5f9", textColor: "#475569" },
};

export const PRIORITY_CONFIG = {
  low: { label: "Low", color: "default", bgColor: "#f1f5f9", textColor: "#475569" },
  normal: { label: "Normal", color: "info", bgColor: "#dbeafe", textColor: "#1d4ed8" },
  high: { label: "High", color: "warning", bgColor: "#fef3c7", textColor: "#b45309" },
  urgent: { label: "Urgent", color: "error", bgColor: "#fee2e2", textColor: "#b91c1c" },
};

export const PAYMENT_MODE_CONFIG = {
  cash: { label: "Cash", icon: "💵" },
  upi: { label: "UPI", icon: "📱" },
  bank_transfer: { label: "Bank Transfer", icon: "🏦" },
  cheque: { label: "Cheque", icon: "📝" },
  neft: { label: "NEFT", icon: "🔄" },
  rtgs: { label: "RTGS", icon: "⚡" },
  other: { label: "Other", icon: "💰" },
};

// GSTIN validation
export const isValidGSTIN = (gstin) => {
  if (!gstin) return true; // optional field
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.toUpperCase());
};

// Truncate text
export const truncate = (str, length = 30) => {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
};
