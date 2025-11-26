/**
 * Date utility functions for formatting and parsing dates
 */

/**
 * Format a date string for use in HTML date inputs (YYYY-MM-DD format)
 * Handles ISO strings, date-time strings, and extracts just the date portion
 * @param dateString - Date string in any format
 * @returns Date in YYYY-MM-DD format for input[type="date"]
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return "";
  // Extract just the date part (YYYY-MM-DD) from ISO string or date-time string
  const date = dateString.split("T")[0];
  return date;
}

/**
 * Format a date string for display (e.g., "Jan 15, 2024")
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options || defaultOptions);
  } catch {
    return dateString;
  }
}

/**
 * Format a time string for display (e.g., "14:30" -> "2:30 PM")
 * @param timeString - Time in HH:mm format
 * @returns Formatted time string
 */
export function formatTimeForDisplay(timeString: string): string {
  if (!timeString) return "";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

/**
 * Check if a date is today
 * @param dateString - ISO date string
 * @returns true if date is today
 */
export function isToday(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 * @param dateString - ISO date string
 * @returns true if date is tomorrow
 */
export function isTomorrow(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Get a relative date label (Today, Tomorrow, or formatted date)
 * @param dateString - ISO date string
 * @returns "Today", "Tomorrow", or formatted date
 */
export function getRelativeDateLabel(dateString: string): string {
  if (!dateString) return "";
  if (isToday(dateString)) return "Today";
  if (isTomorrow(dateString)) return "Tomorrow";
  return formatDateForDisplay(dateString, { month: "short", day: "numeric" });
}
