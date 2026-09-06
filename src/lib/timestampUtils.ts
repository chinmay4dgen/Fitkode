/**
 * Timestamp utilities with Indian Standard Time (IST) timezone display.
 * Ensures consistent formatting across the application with 'IST' explicitly appended.
 */

export function formatISTDateTime(
  input?: string | number | Date | null,
  fallback = 'Recently (IST)'
): string {
  if (!input) return fallback;
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return fallback;

    const datePart = date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const timePart = date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${datePart}, ${timePart} IST`;
  } catch {
    return fallback;
  }
}

export function formatISTDate(
  input?: string | number | Date | null,
  fallback = 'N/A'
): string {
  if (!input) return fallback;
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return fallback;

    const datePart = date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return `${datePart} IST`;
  } catch {
    return fallback;
  }
}

export function formatISTTime(
  input?: string | number | Date | null,
  fallback = ''
): string {
  if (!input) return fallback;
  try {
    const date = new Date(input);
    if (isNaN(date.getTime())) return fallback;

    const timePart = date.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${timePart} IST`;
  } catch {
    return fallback;
  }
}

export function getISTPrintHeader(): string {
  return formatISTDateTime(new Date());
}
