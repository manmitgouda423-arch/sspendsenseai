export type TxKind = "income" | "expense";

export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "business",
  "interest",
  "rental",
  "gift",
  "other",
] as const;

export const EXPENSE_CATEGORIES = [
  "food",
  "travel",
  "shopping",
  "medical",
  "fuel",
  "education",
  "entertainment",
  "utilities",
  "subscriptions",
  "bills",
  "rent",
  "loan-emi",
  "insurance",
  "other",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "credit-card",
  "debit-card",
  "net-banking",
  "wallet",
] as const;

export const ACCOUNT_TYPES = [
  "savings",
  "current",
  "wallet",
  "cash",
  "credit-card",
  "upi",
] as const;

export const GOAL_PRESETS = [
  "Emergency Fund",
  "Bike",
  "Car",
  "Laptop",
  "House",
  "Vacation",
  "Marriage",
  "Education",
];

export function titleize(value: string) {
  return value
    .split(/[-_\s]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)}`;
  }
}

export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
