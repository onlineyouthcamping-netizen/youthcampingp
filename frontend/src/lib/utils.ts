import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely formats a duration value that can be either a string or an object { nights, days }.
 */
export function formatDuration(duration: any, fallback: string = "08 N / 09 D"): string {
  if (!duration) return fallback;
  if (typeof duration === "string") return duration;
  if (typeof duration === "object") {
    const nights = duration.nights ?? duration.night;
    const days = duration.days ?? duration.day;
    if (nights !== undefined && days !== undefined) {
      const nStr = String(nights).padStart(2, '0');
      const dStr = String(days).padStart(2, '0');
      return `${nStr} N / ${dStr} D`;
    }
    if (days !== undefined) return `${days} Days`;
    if (nights !== undefined) return `${nights} Nights`;
  }
  return String(duration);
}
