import { format, parseISO } from "date-fns";

export function ISO__getTime(timestamp) {
  if (!timestamp) return ""
  return format(parseISO(timestamp), "hh:mm a");
}