import { getDay, isBefore, parse } from "date-fns";

const dayOfWeekToIndexMap = new Map([
  ["Sunday", 0],
  ["Monday", 1],
  ["Tuesday", 2],
  ["Wednesday", 3],
  ["Thursday", 4],
  ["Friday", 5],
  ["Saturday", 6],
]);

export function getRecentNotifications(
  notifications,
  selected,
  { page = 1, limit = 10 } = {}
) {
  const start = (page - 1) * limit
  const end = start + limit

  return notifications
    .filter(notif => filterNotificationByDay(notif, selected))
    .map(notif => ({
      ...notif,
      createdTime: parse(notif.createdDate, "dd-MM-yyyy HH:mm", new Date())
    }))
    .sort((dateA, dateB) => isBefore(dateA, dateB) ? 1 : -1)
    .slice(start, end);
}

export function getReocurrNotification(
  notifications,
  selected,
  { page = 1, limit = 10 } = {}
) {
  const start = (page - 1) * limit
  const end = start + limit

  return notifications
    .filter(notif => filterNotificationByDay(notif, selected))
    .slice(start, end);
}

function filterNotificationByDay(notif, selected) {
  const selectedDayIndexes = selected.length === 0
    ? [0, 1, 2, 3, 4, 5, 6]
    : selected.map(day => dayOfWeekToIndexMap.get(day))

  if (notif.schedule_type === "reocurr") {
    return notif
      .reocurrence
      .some(day => selectedDayIndexes.includes(day))
  }

  return selectedDayIndexes.includes(
    getDay(parse(notif.date, "dd-MM-yyyy", new Date())),
  )
}