import { format, parseISO } from "date-fns";

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