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
  return file ? URL.createObjectURL(file) : null;
}