import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  parseISO
} from 'date-fns';

export function ISO__getTime(timestamp) {
  if (!timestamp) return ""
  return format(parseISO(timestamp), "hh:mm a");
}

export function nameInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map(word => word?.at(0))
    .join("")
    .toUpperCase();
}

export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h ago`;

  const days = differenceInDays(now, date);
  if (days < 2) return 'yesterday';

  return format(date, 'dd-MM');
}