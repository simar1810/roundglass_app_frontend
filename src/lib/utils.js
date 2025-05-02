import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function copyText(text) {
  navigator.clipboard.writeText(text)
}

export function vpDaysPending(points, monthly = 100) {
  return (points / monthly) * 30;
}

export function getObjectUrl(file) {
  return file instanceof File ? URL.createObjectURL(file) : null;
}

export function navigateUserToFeature__notification(type) {
  switch (type) {
    case "retail_request":
      return "/coach/retail";
    case "mealRequest":
      return "/coach/meals/list";
    case "checkup_request":
      return "/coach/client/1234";
    case "goalRequest":
      return "/coach/portfolio";
    case "login-Notification":
      return "#";
    default:
      return "#";
  }
}

export function zoomConnectionLink(coachId) {
  return "https://zoom.us/oauth/authorize?client_id=" +
    process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID +
    "&response_type=code" +
    "&state=" +
    process.env.NEXT_PUBLIC_ZOOM_CLUB_ID +
    "." +
    coachId +
    "&redirect_uri=" +
    process.env.NEXT_PUBLIC_ZOOM_REDIRECT_URL;
}

export function generateMeetingBaseLink(id) {
  return `${process.env.NEXT_PUBLIC_CLIENT_ENDPOINT}/meet/${id}`;
}

export function normalizeHexColor(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 6) return `#${hex}`;
  if (hex.length === 8) return `#${hex.slice(2)}`;
}