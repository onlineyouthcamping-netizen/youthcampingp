import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeFormatDate(dateVal: any, options?: Intl.DateTimeFormatOptions, fallback: string = "N/A"): string {
  if (!dateVal) return fallback;
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  return date.toLocaleDateString('en-IN', options || { day: '2-digit', month: 'short', year: 'numeric' });
}

export function safeFormatDateTime(dateVal: any, options?: Intl.DateTimeFormatOptions, fallback: string = "N/A"): string {
  if (!dateVal) return fallback;
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);
  return date.toLocaleDateString('en-IN', options || {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}
