import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isToday,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import type { RecurrenceFrequency } from "@/types";

export {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isToday,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
};

export function advanceRecurring(
  fromDate: Date,
  frequency: RecurrenceFrequency,
): Date {
  switch (frequency) {
    case "daily":
      return addDays(fromDate, 1);
    case "weekly":
      return addWeeks(fromDate, 1);
    case "biweekly":
      return addWeeks(fromDate, 2);
    case "monthly":
      return addMonths(fromDate, 1);
    case "quarterly":
      return addQuarters(fromDate, 1);
    case "yearly":
      return addYears(fromDate, 1);
  }
}

export function frequencyToMonths(frequency: RecurrenceFrequency): number {
  switch (frequency) {
    case "daily":
      return 1 / 30;
    case "weekly":
      return 1 / 4;
    case "biweekly":
      return 1 / 2;
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "yearly":
      return 12;
  }
}

export function monthlyCostOf(
  amount: number,
  frequency: RecurrenceFrequency,
): number {
  return amount / frequencyToMonths(frequency);
}

export function smartDateLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

export function shortDateLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return format(date, "MMM d");
}

export function fullDateLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return format(date, "EEEE, MMMM d, yyyy");
}

export function timeLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return format(date, "HH:mm");
}

export function monthLabel(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return format(date, "MMMM yyyy");
}

export function isoDate(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d) : d;
  return format(date, "yyyy-MM-dd");
}

/**
 * Convert an ISO date string (yyyy-MM-dd, no time) to a millisecond timestamp
 * in the user's local timezone. If the ISO date refers to today, returns the
 * current timestamp so we keep "now" precision. Otherwise we anchor to local
 * noon to avoid off-by-one timezone surprises.
 */
export function isoToTimestamp(iso: string): number {
  const [yearStr, monthStr, dayStr] = iso.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return Date.now();
  }
  const now = new Date();
  if (
    now.getFullYear() === year &&
    now.getMonth() + 1 === month &&
    now.getDate() === day
  ) {
    return now.getTime();
  }
  return new Date(year, month - 1, day, 12, 0, 0, 0).getTime();
}
