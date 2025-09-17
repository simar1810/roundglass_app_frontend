import { endOfDay, endOfMonth, format, isAfter, isBefore, isSameDay, startOfDay, startOfMonth } from "date-fns";

export function manualAttendance(data, range) {
  const startOfTheDay = startOfDay(range?.from, new Date());
  const endOfTheDay = endOfDay(range?.to, new Date());

  return data.flatMap(client => {
    const filteredAttendance = client.attendance.filter(att =>
      isAfter(att.markedAt, startOfTheDay) &&
      isBefore(att.markedAt, endOfTheDay)
    )
    return filteredAttendance.map(att => ({
      name: client?.client.name,
      profilePhoto: client?.client.profilePhoto,
      ...att
    }))
  })
}

export function shakeRequests(data) {
  return data.flatMap(client => {
    return client.attendance.map(attendance => ({
      ...attendance,
      name: client.client.name,
    }))
  })
}

export function clientWiseHistory(data, year = 2025, month = 8) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return data.map(record => {
    const attendanceMap = {};
    record.attendance.forEach(a => {
      const day = new Date(a.date).getDate();
      attendanceMap[day] = a;
    });

    const monthlyAttendance = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;

      const entry = attendanceMap[dayNum];
      if (entry) {
        return {
          date: dayNum,
          status: entry.status,
          markedAt: entry.markedAt
        };
      } else {
        return {
          date: dayNum,
          status: undefined
        };
      }
    });

    return {
      clientName: record.client.name,
      clientProfile: record.client.profilePhoto,
      monthlyAttendance
    };
  });
}


export function clubHistory(clients) {
  return clients.map((record, index) => {
    const { client, attendance } = record;

    const presentDays = attendance
      .filter(a => a.status === "present")
      .length;
    const absentDays = attendance
      .filter(a => a.status === "absent")
      .length;

    const totalConsidered = presentDays + absentDays;
    const showupPercentage =
      totalConsidered > 0
        ? ((presentDays / totalConsidered) * 100).toFixed(1)
        : 0;

    let showupLabel = "N/A";

    if (showupPercentage >= 75) {
      showupLabel = "High";
    } else if (showupPercentage >= 50) {
      showupLabel = "Moderate";
    } else if (showupPercentage > 25) {
      showupLabel = "Low";
    } else {
      showupLabel = "Very Low"
    }

    return {
      clientId: index + 1,
      clientName: client.name,
      clientProfile: client.profilePhoto,
      clientStatus: client.isPhysicalClubActive,
      presentDays,
      absentDays,
      showupPercentage: Number(showupPercentage),
      showupLabel
    };
  });
}


export function generateAttendanceRows(data) {
  const today = new Date()

  return data.map((record, index) => {
    const todayAttendance = record.attendance.find(a =>
      isSameDay(new Date(a.date), today)
    )

    return {
      clientId: index + 1,
      clientName: record.client.name,
      date: format(today, "dd MMM, yyyy"),
      status: todayAttendance ? todayAttendance.status : undefined,
      profilePhoto: record.client.profilePhoto
    }
  })
}

export function statusClases(status) {
  switch (status) {
    case "absent":
      return "bg-red-100 text-red-600"
    case "present":
      return "bg-green-100 text-green-700"
    default:
      return "text-white bg-[#909090]";
  }
}