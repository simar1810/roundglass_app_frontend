import { endOfDay, isAfter, isBefore, startOfDay } from "date-fns";

export function manualAttendance(data, range) {
  const startOfTheDay = startOfDay(range?.from, new Date());
  const endOfTheDay = endOfDay(range?.to, new Date());

  return data.map(client => {
    const todaysAttendance = client.attendance.find(att =>
      isAfter(att.markedAt, startOfTheDay) &&
      isBefore(att.markedAt, endOfTheDay)
    )

    return {
      name: client.client?.name,
      profilePhoto: client.client?.profilePhoto,
      status: todaysAttendance?.status,
      markedAt: todaysAttendance?.markedAt
    }
  })
}