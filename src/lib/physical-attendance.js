import {
  endOfDay, format, isAfter, isBefore,
  isSameDay, startOfDay
} from "date-fns";
import { _throwError } from "./formatter";

export function manualAttendance(data, range) {
  const startOfTheDay = startOfDay(range?.from, new Date());
  const endOfTheDay = endOfDay(range?.to, new Date());

  return data.flatMap(client => {
    const filteredAttendance = client.attendance.filter(att =>
      isAfter(att.markedAt, startOfTheDay) &&
      isBefore(att.markedAt, endOfTheDay)
    )
    return filteredAttendance.map(att => ({
      clientId: client.client._id,
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
      clientId: client.client._id,
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
      isSameDay(new Date(a.markedAt), today)
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

export function dateWiseAttendanceSplit(data) {
  const badgeData = {}

  data.forEach(item => {
    const dateKey = format(new Date(item.date), "yyyy-MM-dd")

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
  const exportData = ["Sr No.", "Client Name", "Request Date", "Time", "Status"]
  for (const index of attendance) {
  }
  return exportData
}

function shakeRequestExcelData(data) {
  const requests = shakeRequests(data)
  return requests.map((record, index) => ({
    "Sr No.": index,
    "Client Name": record.name,
    "Request Date": format(record.markedAt, "dd-MM-yyyy"),
    "Time": format(record.markedAt, "HH:MM a"),
    "Status": record.status
  }))
}

function clientWiseExcelData(data) {
  const records = clientWiseHistory(data);
  return records.map((record, index) => {
    const item = {}
    item[" Sr No."] = index + 1
    item[" Name"] = record.clientName
    for (const info of record.monthlyAttendance) {
      item[info["date"]] = info["status"] || "requested"
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