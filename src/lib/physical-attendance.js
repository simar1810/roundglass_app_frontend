import {
  addDays,
  differenceInCalendarDays,
  endOfDay, format, isAfter, isBefore,
  isSameDay, startOfDay
} from "date-fns";

export function manualAttendance(data, range) {
  const startOfTheDay = startOfDay(range?.from, new Date());
  const endOfTheDay = endOfDay(range?.to, new Date());

  return data.flatMap(client => {
    const filteredAttendance = (client?.attendance || []).filter(att =>
      isAfter(att.markedAt, startOfTheDay) &&
      isBefore(att.markedAt, endOfTheDay)
    )
    return filteredAttendance.map(att => ({
      clientId: client?.client?._id,
      name: client?.client?.name,
      profilePhoto: client?.client?.profilePhoto,
      ...att
    }))
  })
}

export function manualAttendanceWithRange(data, range) {
  const start = startOfDay(range?.from || new Date());
  const end = endOfDay(range?.to || new Date());
  const totalDays = Math.abs(differenceInCalendarDays(range.from, range.to)) + 1;

  return data
    .map(client => {
      const attendanceMap = {};
      (client?.attendance || []).forEach(att => {
        const marked = new Date(att.date);
        if (marked >= start && marked <= end) {
          const dayIndex = Math.floor((marked - start) / (1000 * 60 * 60 * 24));
          attendanceMap[dayIndex] = att;
        }
      });

      const dailyAttendance = Array.from({ length: totalDays }, (_, i) => {
        const currentDate = addDays(start, i);
        const entry = attendanceMap[i];
        return entry
          ? {
            date: currentDate.toISOString(),
            status: entry.status,
            markedAt: entry.markedAtl,
            name: client?.client?.name,
            profilePhoto: client?.client?.profilePhoto,
            clientId: client?.client?._id
          }
          : {
            date: currentDate.toISOString(),
            status: undefined,
            name: client?.client?.name,
            profilePhoto: client?.client?.profilePhoto,
            clientId: client?.client?._id
          };
      });

      return {
        clientName: client?.client?.name,
        clientProfile: client?.client?.profilePhoto,
        dailyAttendance
      };
    })
    .flatMap(client => client?.dailyAttendance);
}

export function shakeRequests(data) {
  return data
    .flatMap(client => {
      return (client?.attendance || []).map(attendance => ({
        ...attendance,
        clientId: client?.client?._id,
        name: client?.client?.name,
      }))
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
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
      clientName: record?.client?.name,
      clientProfile: record?.client?.profilePhoto,
      monthlyAttendance
    };
  });
}


export function clubHistory(clients) {
  return clients.map((record, index) => {
    const { client, attendance, membership } = record;
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
      clientName: client?.name,
      clientProfile: client?.profilePhoto,
      clientStatus: client?.isPhysicalClubActive,
      presentDays,
      absentDays,
      showupPercentage: Number(showupPercentage),
      showupLabel,
      pendingServings: membership?.pendingServings || 0,
      membershipType: membership?.membershipType || "Monthly",
      endDate: membership?.endDate || new Date(),
    };
  });
}

export function generateAttendanceRows(data) {
  const today = new Date()

  return data.map((record, index) => {
    const todayAttendance = record.attendance.find(a =>
      isSameDay(new Date(a.markedAt), today)
    )

    return {
      clientId: index + 1,
      clientName: record?.client?.name,
      date: format(today, "dd MMM, yyyy"),
      status: todayAttendance ? todayAttendance.status : undefined,
      profilePhoto: record?.client?.profilePhoto
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

export function dateWiseAttendanceSplit(data) {
  const badgeData = {}

  data.forEach(item => {
    const dateKey = format(item.date, "yyyy-MM-dd")

    if (!badgeData[dateKey]) {
      badgeData[dateKey] = { present: 0, absent: 0, requested: 0 }
    }

    switch (item.status) {
      case "present":
        badgeData[dateKey].present += 1
        break
      case "absent":
        badgeData[dateKey].absent += 1
        break
      case "requested":
        badgeData[dateKey].requested += 1
        break
      default:
        break
    }
  })

  const formattedData = {}
  Object.keys(badgeData).forEach(dateKey => {
    const badges = []

    if (badgeData[dateKey].present > 0) {
      badges.push({ value: String(badgeData[dateKey].present), color: "bg-green-500" })
    }
    if (badgeData[dateKey].absent > 0) {
      badges.push({ value: String(badgeData[dateKey].absent), color: "bg-red-500" })
    }
    if (badgeData[dateKey].requested > 0) {
      badges.push({ value: String(badgeData[dateKey].requested), color: "bg-yellow-500" })
    }

    formattedData[dateKey] = badges
  })

  return formattedData
}

export function getPresentAbsent(data) {
  let present = 0
  let absent = 0
  let requested = 0

  data.forEach(record => {
    record.attendance.forEach(att => {
      if (att.status === "present") present++
      else if (att.status === "absent") absent++
      else if (att.status === "requested") requested++
    })
  })

  return { present, absent, requested }
}

function manualAttendanceExcelData(data) {
  const attendance = manualAttendance(data)
  for (const index of attendance) { }
  return {}
}

function shakeRequestExcelData(data) {
  const requests = shakeRequests(data)
  return requests.map((record, index) => ({
    "Sr No.": index + 1,
    "Client Name": record.name,
    "Request Date": format(record.markedAt, "dd-MM-yyyy"),
    "Time": format(record.markedAt, "HH:MM a"),
    "Status": record.status
  }))
}

function clientWiseExcelData(data) {
  const records = clientWiseHistory(data);
  return records.map((record, index) => {
    const item = {
      "Sr No.": index + 1,
      "Name": record.clientName,
    };
    for (const info of record.monthlyAttendance) {
      item[String(" " + info["date"])] = info["status"] || "requested"
    }
    return item
  })
}

function clubHistoryExcelData(data) {
  const records = clubHistory(data);
  return records.map((record, index) => ({
    "Sr No.": index,
    "Name": record.clientName,
    "Client Status": record.clientStatus ? "Active" : "In Active",
    "Present Days": record.presentDays,
    "Absent Days": record.absentDays,
    "Showup Percentage": `${record.showupPercentage || 0}%`
  }))
}

function generateAttendanceRowsExcelData(data) {
  const records = generateAttendanceRows(data);
  return records.map((record, index) => ({
    "Sr No.": index + 1,
    "Name": record.clientName,
    "Date": record.date,
    "Status": record.status || "requested"
  }))
}

export function physicalAttendanceExcelDownload(
  tab,
  data
) {
  switch (tab) {
    case "manual-attendance":
      return manualAttendanceExcelData(data)
    case "shake-requests":
      return shakeRequestExcelData(data)
    case "clientwise-history":
      return clientWiseExcelData(data)
    case "club-history":
      return clubHistoryExcelData(data)
    case "daily-attendance":
      return generateAttendanceRowsExcelData(data)
    default:
      break;
  }
}