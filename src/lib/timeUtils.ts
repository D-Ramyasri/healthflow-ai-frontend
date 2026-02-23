import { format, formatInTimeZone } from 'date-fns-tz';

// IST Timezone
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a date to IST string
 * @param date - Date to format
 * @param formatStr - Format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Formatted date string in IST
 */
export function formatToIST(date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, IST_TIMEZONE, formatStr);
}

/**
 * Get current time in IST
 * @param formatStr - Format string (default: 'yyyy-MM-dd HH:mm:ss')
 * @returns Current time formatted in IST
 */
export function getCurrentIST(formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  return formatInTimeZone(new Date(), IST_TIMEZONE, formatStr);
}

/**
 * Convert UTC timestamp to IST display format
 * @param utcTimestamp - UTC timestamp string
 * @param formatStr - Format string (default: 'MMM dd, yyyy HH:mm')
 * @returns Formatted IST time
 */
export function displayISTTime(utcTimestamp: string, formatStr: string = 'MMM dd, yyyy HH:mm'): string {
  try {
    const date = new Date(utcTimestamp + (utcTimestamp.includes('Z') ? '' : 'Z'));
    return formatInTimeZone(date, IST_TIMEZONE, formatStr);
  } catch (error) {
    console.error('Error formatting IST time:', error);
    return utcTimestamp; // Fallback to original
  }
}

/**
 * Get relative time in IST (e.g., "2 hours ago")
 * @param utcTimestamp - UTC timestamp string
 * @returns Relative time string
 */
export function getRelativeISTTime(utcTimestamp: string): string {
  try {
    const date = new Date(utcTimestamp + (utcTimestamp.includes('Z') ? '' : 'Z'));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return formatInTimeZone(date, IST_TIMEZONE, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return utcTimestamp;
  }
}