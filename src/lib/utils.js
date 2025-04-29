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