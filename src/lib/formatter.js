import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  parseISO,
  parse
} from 'date-fns';

export function ISO__getTime(timestamp) {
  if (!timestamp) return ""
  return format(parseISO(timestamp), "hh:mm a");
}

export function nameInitials(name) {
  return name
    ?.split(" ")
    ?.slice(0, 2)
    ?.map(word => word?.at(0))
    ?.join("")
    ?.toUpperCase();
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

export function format24hr_12hr(time24) {
  return format(parse(time24, 'HH:mm', new Date()), 'hh:mm a');
}

export function trimString(str, max = 20) {
  const total = str.split(" ");
  const ellipsis = total.length > max ? "..." : "";
  return total.slice(0, max).join(" ") + ellipsis;
}

export function meetingAttendaceExcel(meetingType, data) {
  if (meetingType === "reocurr") {
    return data.map((attendance, index) => ({
      "Sr No.": index + 1,
      "Client Name": (attendance.details || [])?.map(d => d.name)?.join("\n"),
      "Roll No": (attendance.details || [])?.map(d => d.rollno)?.join("\n"),
      "Joining Date": attendance.commonDate,
      "Joining Time": (attendance.details || [])?.map(d => d.time)?.join("\n"),
    }));
  }

  return data.map((attendance, index) => ({
    "Sr No.": index + 1,
    "Client Name": attendance.name,
    "Roll No": attendance.rollno,
    "Joining Date": attendance?.attendance?.date,
    "Joining Time": attendance?.attendance?.time,
  }))
}

export function buildUrlWithQueryParams(baseUrl, paramsObject = {}) {
  const query = Object.entries(paramsObject)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return baseUrl.includes("?") ? `${baseUrl}&${query}` : `${baseUrl}?${query}`;
}

export function tabChange(value, router, params, pathname) {
  const newParams = new URLSearchParams(params.toString());
  newParams.set("tab", value);
  router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
};

export function getMembershipType(membership) {
  switch (membership.membershipType) {
    case 1:
      return { type: "Monthly", end: format(membership.endDate, "dd/MM/yyyy") }
    case 2:
      return { type: "Servings", end: membership.pendingServings }
    default:
      return { type: "Unknown", end: "Unknown" };
  }
}