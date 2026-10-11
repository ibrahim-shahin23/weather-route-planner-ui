export const fmtMiles = (miles: number): string =>
  miles >= 100 ? Math.round(miles).toLocaleString() : miles.toFixed(miles < 10 ? 1 : 0);

export function fmtDuration(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

export const fmtDay = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

export const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

export const fmtHour = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric' }).format(new Date(iso));

export const localTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Value for <input type="datetime-local"> in the user's local time. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function nextFullHour(from = new Date()): Date {
  const d = new Date(from);
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

/** Thin a path to at most `max` vertices (keeps first and last). */
export function decimate<T>(path: T[], max: number): T[] {
  if (path.length <= max) return path;
  const stride = Math.ceil(path.length / max);
  const out = path.filter((_, i) => i % stride === 0);
  if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1]);
  return out;
}
