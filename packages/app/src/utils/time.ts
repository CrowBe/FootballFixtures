/**
 * Format an ISO 8601 kickoff string in the user's local timezone.
 * All display times in the app use these helpers — no hardcoded offsets.
 */

export function formatKickoffTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatKickoffDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatKickoffFull(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns the date part only (YYYY-MM-DD in local time) for grouping. */
export function localDateKey(isoString: string): string {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
