
/**
 * Returns the current date shifted to match the local wall-clock time as if it were UTC.
 * This is used to maintain consistency with the database pattern where "visual time" is stored as UTC.
 * Specifically handles the Brazil/Sao_Paulo (-03:00) offset for server-side calls.
 */
export function getWallClockNow(): Date {
  const now = new Date();
  // We want to force -03:00 regardless of server timezone
  // Brazilian offset is usually 180 minutes. 
  // If we want to be more dynamic, we could use getTimezoneOffset(), 
  // but if the server is in UTC (Vercel), offset is 0. 
  // We want to shift it as if it were in Brazil.
  const brOffset = 3 * 60 * 60 * 1000; // 3 hours
  return new Date(now.getTime() - brOffset);
}

/**
 * Converts a given date to the wall-clock time as UTC.
 */
export function toWallClock(date: Date | string | null): Date | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  // If it's already an ISO string with 'Z', we assume it might be a true UTC instant 
  // and we want to shift it to visual. 
  const brOffset = 3 * 60 * 60 * 1000;
  return new Date(d.getTime() - brOffset);
}

/**
 * Formats a date for a datetime-local input field (YYYY-MM-DDTHH:mm).
 * Internal dates are stored as Visual Time in UTC format (e.g. 10:00Z for 10:00AM local).
 */
export function formatToLocalDatetime(date: Date | string | null): string {
  if (!date) return "";
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    
    // Since we store visual numbers as UTC, toISOString() gives exactly the numbers we want.
    return d.toISOString().slice(0, 16);
  } catch (e) {
    return "";
  }
}

/**
 * Parses a string from datetime-local input and returns a Date object set to that visual time in UTC.
 */
export function parseLocalToWallClockUTC(datetimeStr: string | null): Date | null {
  if (!datetimeStr) return null;
  try {
    // Input: "2024-04-02T20:05"
    // Output: Date object of "2024-04-02T20:05:00.000Z"
    if (datetimeStr.length === 16 && !datetimeStr.includes("Z")) {
      return new Date(datetimeStr + ":00Z");
    }
    return new Date(datetimeStr);
  } catch (e) {
    return null;
  }
}
