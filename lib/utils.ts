import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatEtb(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount)} ETB`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function toNumber(value: FormDataEntryValue | null) {
  if (value === null || value === "") return 0;
  return Number(value);
}

export function stockStatus(quantity: number, minimum: number) {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= minimum) return "Low Stock";
  return "In Stock";
}

export function paymentStatus(total: number, paid: number) {
  const remaining = Math.max(total - paid, 0);
  if (remaining <= 0) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "CREDIT";
}
