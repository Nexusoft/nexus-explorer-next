import { isNum, NO_VALUE } from './converter';

const pad = (n) => (n > 9 ? `${n}` : `0${n}`);

/** Unix seconds to "2026-07-26 08:31:47 UTC" */
export function formatDate(unixSeconds) {
  if (!isNum(Number(unixSeconds)) || !unixSeconds) return NO_VALUE;
  const d = new Date(unixSeconds * 1000);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
      d.getUTCDate()
    )} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(
      d.getUTCSeconds()
    )} UTC`
  );
}

/** Short date for tables, "2026-07-26 08:31" */
export function formatDateShort(unixSeconds) {
  const full = formatDate(unixSeconds);
  return full === NO_VALUE ? full : full.slice(0, 16);
}

const units = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['min', 60],
  ['sec', 1],
];

/** Unix seconds to "3 days ago" */
export function timeAgo(unixSeconds, now = Date.now() / 1000) {
  if (!isNum(Number(unixSeconds)) || !unixSeconds) return '';
  const diff = Math.max(0, Math.round(now - unixSeconds));
  if (diff < 5) return 'just now';
  for (const [name, secs] of units) {
    if (diff >= secs) {
      const n = Math.floor(diff / secs);
      return `${n} ${name}${
        n > 1 && name !== 'min' && name !== 'sec' ? 's' : ''
      } ago`;
    }
  }
  return '';
}

/** Amount with thousands separators and up to `digits` decimals */
export function formatAmount(value, digits = 6) {
  if (!isNum(Number(value)) || value === null || value === '') return NO_VALUE;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
  }).format(Number(value));
}

/** Integer with thousands separators */
export function formatInt(value) {
  return formatAmount(value, 0);
}

/** "8BZcAo48...Fv9DBi" */
export function shortHash(value, keep = 8) {
  if (!value) return '';
  const s = value.toString();
  return s.length > keep * 2 + 3
    ? `${s.slice(0, keep)}...${s.slice(-keep)}`
    : s;
}

/** Bytes to "806 B" / "1.2 kB" */
export function formatBytes(value) {
  if (!isNum(Number(value))) return NO_VALUE;
  return value < 1024 ? `${value} B` : `${(value / 1024).toFixed(1)} kB`;
}
