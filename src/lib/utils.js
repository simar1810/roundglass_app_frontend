import { clsx } from "clsx";
import { differenceInCalendarDays, format, isValid, parse } from "date-fns";
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

export function normalizeHexColor(hex = "") {
  hex = hex.replace(/^#/, '');
  if (hex.length === 6) return `#${hex}`;
  if (hex.length === 8) return `#${hex.slice(2)}`;
}

export function youtubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.slice(1); // short URL
    }

    if (hostname.includes('youtube.com')) {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/embed/')[1];
      }

      if (parsedUrl.pathname.startsWith('/v/')) {
        return parsedUrl.pathname.split('/v/')[1];
      }
    }
  } catch (e) {
    return false;
  }

  return false;
}

export function subscriptionDaysRemaining(planCode, endDate) {
  if (isNaN(planCode) || !endDate) {
    return {
      success: false,
      message: "No subscription plan found."
    };
  }
  const today = format(new Date(), 'dd-MM-yyyy');
  const pendingDays = daysDifference__notification(today, endDate);
  if (daysDifference__notification(today, endDate) < 0) {
    return {
      success: false,
      message: "Your subscription has expired. Please renew your subscription to continue using the features."
    };
  }
  switch (planCode) {
    case 0:
      return ({
        success: true,
        planType: "Free Trial Plan",
        pendingDays
      });
    case 1:
      return ({
        success: true,
        planType: "Basic Plan",
        pendingDays
      });
    case 2:
      return ({
        success: true,
        planType: "Pro Plan",
        pendingDays
      });
    default:
      return ({ success: false });
  }
}

export function daysDifference__notification(...dates) {
  const parseFlexibleDates = dates.map(dateStr => {
    let parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
    if (!isValid(parsed)) {
      parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    }
    return parsed;
  });

  if (!isValid(parseFlexibleDates[0]) || !isValid(parseFlexibleDates[1])) {
    throw new Error('Invalid date format. Use dd-MM-yyyy or yyyy-MM-dd');
  }

  return differenceInCalendarDays(parseFlexibleDates[1], parseFlexibleDates[0]);
}